import React, { useState, useEffect, useRef } from 'react';
import { getUserData, getChatContacts, getChatMessages, sendMessage } from '../../services/api';
import placeholderAvatar from '../../assets/img/avatar.png';
import { PUBLIC_STORAGE_URL } from '../../config/apiConfig';
import './ChatPage.css';

const ChatPage = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(true);
    
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const pollingInterval = useRef(null);

    // 1. Inicialização: Carrega Usuário e Lista de Participantes
    useEffect(() => {
        const initChat = async () => {
            try {
                const userRes = await getUserData();
                const user = userRes.data || userRes;
                setCurrentUser(user);

                const contactsRes = await getChatContacts();
                const contactsData = contactsRes.data?.data || contactsRes.data || [];
                setParticipants(contactsData);

                // Carrega mensagens imediatamente
                fetchMessages(true);

            } catch (error) {
                console.error("Erro ao iniciar chat:", error);
            }
        };

        initChat();

        // Polling: Atualiza mensagens a cada 3s sem mostrar loading visual
        pollingInterval.current = setInterval(() => {
            fetchMessages(false);
        }, 3000);

        return () => clearInterval(pollingInterval.current);
    }, []);

    // 2. Função para buscar mensagens do servidor
    const fetchMessages = async (showLoading = false) => {
        if (showLoading) setLoadingMessages(true);
        try {
            const res = await getChatMessages();
            const msgs = res.data?.data || res.data || [];
            
            // Ordena por data (mais antigas no topo, novas embaixo)
            // Tenta usar 'data' (do seu payload) ou 'created_at' (padrão Laravel)
            const sortedMsgs = msgs.sort((a, b) => {
                const dateA = new Date(a.data || a.created_at);
                const dateB = new Date(b.data || b.created_at);
                return dateA - dateB;
            });
            
            // Atualiza o estado apenas se houver mudança na quantidade para evitar re-renders
            setMessages(prev => {
                if (prev.length !== sortedMsgs.length) return sortedMsgs;
                return prev; 
                // Nota: Para ser perfeito, deveria comparar o ID da última mensagem, 
                // mas length funciona bem para chats simples.
            });

        } catch (error) {
            console.error("Erro no polling:", error);
        } finally {
            if (showLoading) setLoadingMessages(false);
        }
    };

    // 3. Scroll Inteligente
    // Só rola para baixo automaticamente se o usuário JÁ estiver perto do fim
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        // Se a distância do scroll até o fim for pequena (< 150px) OU for a primeira carga
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;

        if (isNearBottom || loadingMessages) {
            // Usa setTimeout para garantir que o DOM atualizou
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    }, [messages, loadingMessages]);

    // 4. Enviar Mensagem
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        // Formata Data para MySQL (YYYY-MM-DD HH:mm:ss)
        const now = new Date();
        const formattedDate = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + ' ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0') + ':' +
            String(now.getSeconds()).padStart(2, '0');

        const payload = {
            mensagem_chat: newMessage,
            visto: 'n', // CORREÇÃO: Backend espera 's' ou 'n' (string), não 0
            data: formattedDate,
            users_id: currentUser.id
        };

        // Limpa input imediatamente para UX rápida
        const msgText = newMessage;
        setNewMessage('');

        try {
            await sendMessage(payload);
            fetchMessages(false); // Atualiza lista oficial
            
            // Força scroll para baixo após envio
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        } catch (error) {
            console.error("Erro ao enviar:", error);
            // Devolve o texto para o input em caso de erro
            setNewMessage(msgText);
            alert("Não foi possível enviar a mensagem. Tente novamente.");
        }
    };

    // Helpers de Renderização
    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return ''; // Data inválida
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessages = () => {
        let lastDate = null;
        
        return messages.map((msg, index) => {
            const rawDate = msg.data || msg.created_at;
            const msgDateObj = new Date(rawDate);
            const msgDate = msgDateObj.toLocaleDateString();
            const showDateDivider = msgDate !== lastDate;
            lastDate = msgDate;

            // Identifica se a mensagem é do usuário atual
            const isMe = String(msg.users_id) === String(currentUser?.id);
            
            // Identifica o nome do remetente
            let senderName = msg.user_name || "Usuário";
            if (!isMe && participants.length > 0) {
                const sender = participants.find(p => String(p.id) === String(msg.users_id));
                if (sender) senderName = sender.name;
            }

            return (
                <React.Fragment key={msg.id || index}>
                    {showDateDivider && (
                        <div className="message-date-divider">{msgDate}</div>
                    )}
                    <div className={`message-bubble ${isMe ? 'sent' : 'received'}`}>
                        {!isMe && <div className="message-author">{senderName}</div>}
                        <div className="message-text">{msg.mensagem_chat}</div>
                        <span className="message-time">
                            {formatTime(rawDate)}
                            {/* Ícone de visto apenas se necessário/suportado */}
                            {isMe && msg.visto === 's' && (
                                <i className="bi bi-check2-all" style={{marginLeft: 5, color: '#3498db'}}></i>
                            )}
                        </span>
                    </div>
                </React.Fragment>
            );
        });
    };

    return (
        <div className="chat-container">
            
            {/* --- SIDEBAR (Visualização dos Membros) --- */}
            <aside className="chat-sidebar">
                <div className="sidebar-header">
                    <h3>Membros da Equipe</h3>
                </div>
                <div className="contacts-list">
                    {participants.map(contact => (
                        <div key={contact.id} className="contact-item">
                            <div className="contact-avatar">
                                <img src={contact.foto ? `${PUBLIC_STORAGE_URL}/${contact.foto}` : placeholderAvatar} alt={contact.name} />
                                {/* Bolinha verde se for o usuário atual, cinza outros (ou lógica de online se tiver) */}
                                <span className={`status-dot ${contact.id === currentUser?.id ? 'online' : ''}`}></span>
                            </div>
                            <div className="contact-info">
                                <div className="contact-name">
                                    {contact.name} {contact.id === currentUser?.id ? '(Você)' : ''}
                                </div>
                                <div className="contact-role">
                                    {contact.nivel_user == 1 ? 'Inspetora' : contact.nivel_user == 2 ? 'Nutricionista' : 'Diretora'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* --- JANELA DE CHAT (Grupo Geral) --- */}
            <main className="chat-window">
                {/* Header do Chat */}
                <div className="chat-header">
                    <div className="chat-user-profile">
                        <div className="contact-avatar group-avatar">
                            <i className="bi bi-people-fill"></i>
                        </div>
                        <div className="chat-user-details">
                            <h4>Chat Geral da Equipe</h4>
                            <p className="chat-user-status">Todos os membros</p>
                        </div>
                    </div>
                </div>

                {/* Área de Mensagens */}
                <div className="messages-area" ref={messagesContainerRef}>
                    {loadingMessages && messages.length === 0 ? (
                        <div style={{textAlign:'center', marginTop:'20px', color:'#999'}}>
                            <div className="spinner-border spinner-border-sm" role="status"></div> Carregando conversa...
                        </div>
                    ) : messages.length > 0 ? (
                        renderMessages()
                    ) : (
                        <div style={{textAlign:'center', marginTop:'50px', color:'#999', fontSize:'0.9rem'}}>
                            <i className="bi bi-chat-dots" style={{fontSize:'2rem', display:'block', marginBottom:'10px'}}></i>
                            Nenhuma mensagem ainda. Comece a conversa!
                        </div>
                    )}
                    {/* Elemento invisível para rolagem */}
                    <div ref={messagesEndRef} />
                </div>

                {/* Área de Input */}
                <form className="chat-input-area" onSubmit={handleSendMessage}>
                    <button type="button" className="btn-attach" title="Anexar (em breve)">
                        <i className="bi bi-paperclip"></i>
                    </button>
                    <input 
                        type="text" 
                        className="chat-input" 
                        placeholder="Digite sua mensagem para o grupo..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        maxLength={100} // Limite do banco de dados
                    />
                    <button type="submit" className="btn-send" disabled={!newMessage.trim()}>
                        <i className="bi bi-send-fill"></i>
                    </button>
                </form>
            </main>
        </div>
    );
};

export default ChatPage;