import React from 'react';
import './Footer.css';
// 1. Importe as funções dos modais que já criamos
import { showTermsModal, showPrivacyModal } from '../../../utils/modals';

// Importando todas as imagens necessárias
import msLogo from '../../../assets/img/ms.png';
import codeLogo from '../../../assets/img/code2.png';
import sesiSenaiLogo from '../../../assets/img/sesisenai.png';
import andre from '../../../assets/img/Andre.png';
import isabelly from '../../../assets/img/isa.png';
import bianca from '../../../assets/img/Bianca.png';
import larissa from '../../../assets/img/larissa.png';
import cesar from '../../../assets/img/cesar.png';
import nilo from '../../../assets/img/Nilo.jpg';
import marcos from '../../../assets/img/Marcos.png';

const Footer = () => {
  return (
    <footer>
      <div className="footer-container">
        <div className="footer-row">
          <div className="footer-col">
            <img src={msLogo} alt="Menu Solutions Logo" />
            <h3>Menu Solutions</h3>
            <p>Gerenciamento de cozinhas escolares, simplificando a contagem de itens e o controle de refeições.</p>
          </div>
          <div className="divider"></div>
          <div className="footer-col">
            <h3>SESI/SENAI</h3>
            <p>Uma proposta de projeto colaborativo com o objetivo de aprimorar a qualidade de vida dos colaboradores da instituição de ensino, por meio da implementação de soluções automatizadas e eficazes.</p>
            <img src={sesiSenaiLogo} alt="Logo Sesi Senai" className="sesi-senai-logo" />
          </div>
          <div className="divider"></div>
          <div className="footer-col">
            <a href="https://codesolutions.com" target="_blank" rel="noopener noreferrer" className="company-link">
              <img src={codeLogo} alt="Code Solutions Logo" />
              <h3>Code Solutions</h3>
              <p>Desenvolvimento de sistemas inteligentes para otimização de processos, com foco em eficiência e inovação.</p>
            </a>
          </div>
        </div>

        <div className="footer-row team">
          <div className="footer-col" style={{ flexBasis: '100%' }}>
            <h3>Nossa Equipe</h3>
            <div className="team-container">
              <div className="team-group">
                <h4>Alunos</h4>
                <div className="members-wrapper">
                  <div className="member"><img src={andre} alt="Andre Santana" /><p>Andre Santana<br /><span>Front-End</span></p></div>
                  <div className="member"><img src={isabelly} alt="Isabelly Seribeli" /><p>Isabelly Seribeli<br /><span>Front-End</span></p></div>
                  <div className="member"><img src={bianca} alt="Bianca Lima" /><p>Bianca Lima<br /><span>Scrum Master</span></p></div>
                  <div className="member"><img src={larissa} alt="Larissa Oliveira" /><p>Larissa Oliveira<br /><span>Back-End</span></p></div>
                  <div className="member"><img src={cesar} alt="Cesar Esquiçacto" /><p>Cesar Esquiçacto<br /><span>Back-End</span></p></div>
                </div>
              </div>
              <div className="team-divider-vertical"></div>
              <div className="team-group">
                <h4>Professores</h4>
                <div className="members-wrapper">
                  <div className="member"><img src={nilo} alt="Professor Front-End" /><p>Hermilo Lunas<br /><span>Professor Front-End</span></p></div>
                  <div className="member"><img src={marcos} alt="Professor Back-End" /><p>Marcos Reis<br /><span>Professor Back-End</span></p></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-row contact-info">
          <div className="contact-links">
            {/* 2. Ícones trocados para Bootstrap Icons */}
            <a href="https://github.com/AndreSantanas" target="_blank" rel="noopener noreferrer"><i className="bi bi-github"></i> github.AndreSantanas</a>
            <a href="https://github.com/cesaraugustooo" target="_blank" rel="noopener noreferrer"><i className="bi bi-github"></i> github.cesaraugustooo</a>
            <a href="mailto:codesolutionsteam@gmail.com"><i className="bi bi-envelope-fill"></i> codesolutionsteam@gmail.com</a>
            <a href="mailto:biancaflpicolli@gmail.com"><i className="bi bi-envelope-fill"></i> biancaflpicolli@gmail.com</a>
            <a href="https://wa.me/5518997828617" target="_blank" rel="noopener noreferrer"><i className="bi bi-whatsapp"></i> WhatsApp</a>
            <a href="https://andresantanas.github.io/" target="_blank" rel="noopener noreferrer"><i className="bi bi-globe"></i> Code Solutions</a>
          </div>
        </div>

        <div className="footer-row terms-final">
          {/* 3. Links transformados em spans com onClick para chamar os modais */}
          <span className="footer-link" onClick={showTermsModal}>Termos de Uso</span> | <span className="footer-link" onClick={showPrivacyModal}>Política de Privacidade</span>
        </div>

        <div className="copyright">
          <p>© 2025 Menu Solutions. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;