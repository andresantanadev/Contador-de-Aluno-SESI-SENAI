import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';
import '../pages/DashboardNutri/DashboardNutri'; // Usará o mesmo CSS do dashboard

const DashboardWelcomeModal = () => {
  const [shown, setShown] = useState(localStorage.getItem('welcomeNutriShown') === 'true');
  const userName = localStorage.getItem('userName') || 'Nutricionista';

  useEffect(() => {
    if (!shown) {
      Swal.fire({
        title: `Olá, ${userName}!`,
        html: `
          <div class="welcome-modal-content">
            <i class="bi bi-clipboard2-pulse-fill welcome-icon"></i>
            <p>Bem-vinda ao seu painel de controle. Aqui você tem acesso rápido a relatórios e ferramentas de gestão.</p>
          </div>
        `,
        confirmButtonText: 'OK',
        confirmButtonColor: '#198754',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didClose: () => {
          localStorage.setItem('welcomeNutriShown', 'true');
          setShown(true);
        }
      });
    }
  }, [shown, userName]);

  // Este componente não renderiza nada visível, apenas controla o modal.
  return null;
};

export default DashboardWelcomeModal;