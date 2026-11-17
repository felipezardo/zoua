// ============ Configuração do Firebase (Realtime Database) ============
// Usado para guardar na nuvem as imagens das cenas, que antes se perdiam no caminho.
// Aqui está o mesmo projeto do "candeiaescura". Para usar um projeto só do zoua, troque os dados abaixo
// (Console do Firebase > Configurações do projeto > Seus apps > Config).
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBCiZn_rnvezGnnxcOWv4qFGsJq1iQQBwQ",
  authDomain: "candela-ccb6e.firebaseapp.com",
  databaseURL: "https://candela-ccb6e-default-rtdb.firebaseio.com",
  projectId: "candela-ccb6e",
  storageBucket: "candela-ccb6e.firebasestorage.app",
  messagingSenderId: "317430061799",
  appId: "1:317430061799:web:f6ec67a1f4be6abe37a042"
};
// Prefixo dos dados no banco: tudo do zoua fica em um-anel/salas/<CÓDIGO>/ (separado do candeiaescura).
window.FIREBASE_PREFIXO = 'um-anel/salas/';
