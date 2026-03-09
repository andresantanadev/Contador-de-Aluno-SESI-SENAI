import React, { useState, useEffect, useRef } from 'react';
import { 
    getUserData, 
    getChatMembers, // Nova função da API
    getChatMessages, 
    sendMessage 
} from '../../services/api';
import placeholderAvatar from '../../assets/img/avatar.png';
import { PUBLIC_STORAGE_URL2 } from '../../config/apiConfig';
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

    // 1. Inicialização: Carrega Usuário e Lista de Membros (Rota /getMembers)
    useEffect(() => {
        const initChat = async () => {
            try {
                // Busca dados do usuário logado
                const userRes = await getUserData();
                const user = userRes.data || userRes;
                setCurrentUser(user);

                // Busca membros da equipe usando a nova rota especificada
                const membersRes = await getChatMembers();
                const membersData = membersRes.data || membersRes || [];
                setParticipants(membersData);

                // Carrega mensagens iniciais
                await fetchMessages(true);

            } catch (error) {
                console.error("Erro ao iniciar chat:", error);
            }
        };

        initChat();

        // Polling: Atualiza mensagens a cada 3 segundos
        pollingInterval.current = setInterval(() => {
            fetchMessages(false);
        }, 3000);

        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, []);

    // 2. Busca de mensagens
    const fetchMessages = async (showLoading = false) => {
        if (showLoading) setLoadingMessages(true);
        try {
            const res = await getChatMessages();
            const msgs = res.data?.data || res.data || [];
            
            // Ordenação Cronológica
            const sortedMsgs = msgs.sort((a, b) => {
                const dateA = new Date(a.data || a.created_at);
                const dateB = new Date(b.data || b.created_at);
                return dateA - dateB;
            });
            
            // Atualiza apenas se houver novas mensagens
            setMessages(prev => {
                if (prev.length !== sortedMsgs.length) return sortedMsgs;
                return prev; 
            });

        } catch (error) {
            console.error("Erro ao buscar mensagens:", error);
        } finally {
            if (showLoading) setLoadingMessages(false);
        }
    };

    // 3. Controle de Scroll
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;

        if (isNearBottom || loadingMessages) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    }, [messages, loadingMessages]);

    // 4. Envio de Mensagem
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        const now = new Date();
        const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');

        const payload = {
            mensagem_chat: newMessage,
            visto: 'n',
            data: formattedDate,
            users_id: currentUser.id
        };

        const msgText = newMessage;
        setNewMessage('');

        try {
            await sendMessage(payload);
            fetchMessages(false);
            
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        } catch (error) {
            console.error("Erro ao enviar:", error);
            setNewMessage(msgText); // Retorna o texto se falhar
        }
    };

    // Helpers de Formatação
    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '' : date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessages = () => {
        let lastDate = null;
        
        return messages.map((msg, index) => {
            const rawDate = msg.data || msg.created_at;
            const msgDateObj = new Date(rawDate);
            const msgDate = msgDateObj.toLocaleDateString();
            const showDateDivider = msgDate !== lastDate;
            lastDate = msgDate;

            const isMe = String(msg.users_id) === String(currentUser?.id);
            
            // Lógica para encontrar o nome do remetente na lista de participantes
            let senderName = "Usuário";
            if (isMe) {
                senderName = currentUser.name;
            } else {
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
                        <div className="message-footer">
                            <span className="message-time">{formatTime(rawDate)}</span>
                            {isMe && (
                                <i className={`bi ${msg.visto === 's' ? 'bi-check2-all text-primary' : 'bi-check2'}`}></i>
                            )}
                        </div>
                    </div>
                </React.Fragment>
            );
        });
    };

    return (
        <div className="chat-container">
            {/* SIDEBAR: Membros da Equipe */}
            <aside className="chat-sidebar">
                <div className="sidebar-header">
                    <h3>Membros</h3>
                </div>
                <div className="contacts-list">
                    {participants.map(contact => (
                        <div key={contact.id} className="contact-item">
                            <div className="contact-avatar">
                                <img 
                                    src={contact.foto ? `${PUBLIC_STORAGE_URL2}/${contact.foto}` : placeholderAvatar} 
                                    alt={contact.name} 
                                />
                                <span className={`status-dot ${contact.id === currentUser?.id ? 'online' : ''}`}></span>
                            </div>
                            <div className="contact-info">
                                <div className="contact-name">
                                    {contact.name} {contact.id === currentUser?.id ? '(Você)' : ''}
                                </div>
                                <div className="contact-role">
                                    {contact.nivel_user === 1 ? 'Inspetora' : contact.nivel_user === 2 ? 'Nutricionista' : 'Diretora'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* JANELA PRINCIPAL */}
            <main className="chat-window">
                <div className="chat-header">
                    <div className="chat-user-profile">
                        <div className="contact-avatar group-avatar">
                            <i className="bi bi-people-fill"></i>
                        </div>
                        <div className="chat-user-details">
                            <h4>Chat Geral da Equipe</h4>
                            <p className="chat-user-status">{participants.length} membros ativos</p>
                        </div>
                    </div>
                </div>

                <div className="messages-area" ref={messagesContainerRef}>
                    {loadingMessages && messages.length === 0 ? (
                        <div className="chat-loading">
                            <div className="spinner-border spinner-border-sm" role="status"></div>
                            <span>Carregando...</span>
                        </div>
                    ) : messages.length > 0 ? (
                        renderMessages()
                    ) : (
                        <div className="chat-empty-state">
                            <i className="bi bi-chat-dots"></i>
                            <p>Nenhuma mensagem ainda.</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-area" onSubmit={handleSendMessage}>
                    <input 
                        type="text" 
                        className="chat-input" 
                        placeholder="Escreva uma mensagem..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
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