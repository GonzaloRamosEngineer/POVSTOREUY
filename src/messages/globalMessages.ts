// src/messages/globalMessages.ts

export const globalMessages = {
  header: {
    brand: 'POV Store',
    country: 'Uruguay',
  },
  nav: {
    kits: 'Kits',
    emptyKits: 'No hay kits destacados en este momento.',
    viewAllKits: 'Ver todos los Kits',
    cameras: 'Cámaras',
    accessories: 'Accesorios',
    support: 'Soporte',
    adminPanel: 'Admin Panel',
  },
  mobileMenu: {
    title: 'Menú',
    featuredKits: 'Kits Destacados',
    viewAll: 'Ver todos',
  },
  cart: {
    title: 'Tu Carrito',
    empty: 'El carrito está vacío',
    viewProducts: 'Ver productos',
    qty: 'Cant:',
    estimatedTotal: 'Total Estimado',
    emptyCartBtn: 'Vaciar Carrito',
    viewCartBtn: 'Ver Carrito',
    checkoutBtn: 'Finalizar Compra',
    clearModal: {
      title: 'Vaciar Carrito',
      message: '¿Estás seguro de que querés eliminar todos los productos? Esta acción no se puede deshacer.',
      cancelBtn: 'Cancelar',
      confirmBtn: 'Sí, vaciar',
    }
  },
  addToCart: {
    labels: {
      selectModel: 'Seleccionar Modelo',
      quantity: 'Cantidad',
      subtotal: 'Subtotal',
      shipping: 'Envío',
      total: 'Total',
      freeShipping: 'Gratis',
    },
    buttons: {
      adding: 'Agregado',
      add: 'Agregar al carrito',
      buyNow: 'Comprar ahora',
    },
    alerts: {
      lowStock: '¡Stock limitado! Quedan pocas unidades.',
    },
    trustBadges: {
      shipping: 'Envío gratis',
      secure: 'Compra segura',
      return: 'Devolución 30 días',
      payment: 'Pago seguro',
    }
  },
  emptyCartPage: {
    title: 'Tu carrito está vacío',
    subtitle: 'Descubre nuestras cámaras POV 4K y comienza a crear contenido profesional hoy mismo',
    button: 'Ver Productos',
  },
  stockAlert: {
    message: (stock: number) => `¡Solo quedan ${stock} unidades en stock! Completa tu compra ahora`,
  },
  accessoryCard: {
    badges: {
      outOfStock: 'Sin Stock',
      new: 'NUEVO',
    },
    actions: {
      viewDetails: 'Ver detalles',
      notifyMe: 'Notifícame',
      add: 'Añadir',
    },
    whatsappTemplate: (name: string) => `Hola! Quiero que me avisen cuando ingrese stock del accesorio: ${name}`,
  },
  // 👇 SECCIÓN PARA LOS RESÚMENES DE PEDIDO 👇
  orderSummary: {
    title: 'Resumen del Pedido',
    subtotal: 'Subtotal',
    shipping: 'Envío',
    total: 'Total',
    free: 'Gratis',
    pickupFree: 'Retiro (Gratis)',
    productCount: (count: number) => `(${count} ${count === 1 ? 'producto' : 'productos'})`,
    actions: {
      proceedToCheckout: 'Proceder al Pago',
      continueShopping: 'Seguir Comprando',
      toggleShow: 'Ver detalle',
      toggleHide: 'Ocultar',
    },
    benefits: {
      shipping: {
        title: 'Envío Gratis',
        desc: 'A todo Uruguay en compras superiores a $2.000',
      },
      security: {
        title: 'Compra Segura',
        desc: 'Pago protegido con MercadoPago',
      },
      guest: {
        title: 'Sin Registro',
        desc: 'Compra como invitado sin crear cuenta',
      }
    }
  }
};