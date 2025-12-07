// Importa o SweetAlert2 que estará disponível globalmente
import Swal from '../../node_modules/sweetalert2/dist/sweetalert2.all';

// Textos aprimorados para os modais
const termosDeUsoHTML = `
  <div style="text-align: left; font-family: Arial, sans-serif; font-size: 14px; color: #333;">
    <h3 style="color: #c00; border-bottom: 2px solid #c00; padding-bottom: 5px; margin-bottom: 15px;">Termos de Uso – Menu Solutions</h3>
    <p style="margin-bottom: 10px;"><strong>Última atualização:</strong> 24 de setembro de 2025</p>
    
    <p><strong>1. Aceitação dos Termos:</strong> Ao acessar ou utilizar o sistema Menu Solutions, você concorda integralmente com estes Termos de Uso. O acesso é restrito a colaboradores autorizados do SESI, maiores de 18 anos.</p>
    
    <p><strong>2. Finalidade do Sistema:</strong> O Menu Solutions é uma ferramenta de gestão para a cozinha escolar do SESI, destinada a otimizar a contagem de refeições, gerenciar cardápios, facilitar a comunicação e emitir relatórios operacionais.</p>
    
    <p><strong>3. Acesso e Segurança:</strong> O acesso é concedido por administradores via NIF. Cada usuário é responsável pela confidencialidade de suas credenciais.</p>
    
    <p><strong>4. Propriedade Intelectual:</strong> O conteúdo e o código-fonte do sistema são propriedade da Code Solutions. É vedada a cópia ou redistribuição não autorizada.</p>
    
    <p><strong>5. Contato e Suporte:</strong> Para dúvidas ou suporte técnico, contate: <a href="mailto:code.solutions@gmail.com">code.solutions@gmail.com</a>.</p>
    
    <p><strong>6. Foro:</strong> Disputas serão regidas pelas leis brasileiras, com foro na comarca de Regente Feijó – SP.</p>
  </div>
`;

const politicaDePrivacidadeHTML = `
  <div style="text-align: left; font-family: Arial, sans-serif; font-size: 14px; color: #333;">
    <h3 style="color: #c00; border-bottom: 2px solid #c00; padding-bottom: 5px; margin-bottom: 15px;">Política de Privacidade – Menu Solutions</h3>
    <p style="margin-bottom: 10px;"><strong>Última atualização:</strong> 24 de setembro de 2025</p>
    
    <p><strong>1. Coleta de Dados:</strong> O Menu Solutions utiliza o NIF (Número de Identificação Fiscal) como dado essencial para login e identificação. Nenhum outro dado pessoal é coletado diretamente pela plataforma.</p>
    
    <p><strong>2. Uso dos Dados:</strong> Seu NIF é utilizado exclusivamente para controle de acesso, segurança e funcionalidades internas do sistema. Não há uso para fins comerciais ou compartilhamento com terceiros.</p>
    
    <p><strong>3. Segurança da Informação:</strong> Empregamos medidas de segurança para proteger o acesso e a integridade dos dados. O gerenciamento de contas é restrito a administradores autorizados.</p>
    
    <p><strong>4. Seus Direitos:</strong> Você pode solicitar, através de um administrador, a revisão ou exclusão de sua conta de acesso.</p>
    
    <p><strong>5. Contato:</strong> Dúvidas sobre esta política podem ser enviadas para: <a href="mailto:code.solutions@gmail.com">code.solutions@gmail.com</a>.</p>
  </div>
`;

// Funções que serão chamadas no componente de Login
export const showTermsModal = () => {
  Swal.fire({
    title: '<strong>Termos de Uso</strong>',
    html: termosDeUsoHTML,
    showCloseButton: true,
    focusConfirm: false,
    confirmButtonText: 'Entendi!',
    confirmButtonColor: '#910000',
  });
};

export const showPrivacyModal = () => {
  Swal.fire({
    title: '<strong>Política de Privacidade</strong>',
    html: politicaDePrivacidadeHTML,
    showCloseButton: true,
    focusConfirm: false,
    confirmButtonText: 'Entendi!',
    confirmButtonColor: '#910000',
  });
};