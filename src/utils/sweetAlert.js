import Swal from 'sweetalert2/dist/sweetalert2.all.min.js';

const MySwal = Swal.mixin({
    // Isso aplica o target globalmente para todos que usarem este MySwal
    target: '.app-container', 
    confirmButtonColor: '#28a745',
    cancelButtonColor: '#dc3545',
    reverseButtons: true,
    customClass: {
        container: 'my-swal-global-container'
    }
});

export default MySwal;