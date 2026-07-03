import { Client } from '@stomp/stompjs';

export interface ProjectDelta {
  action: 'PUSH' | 'POP' | 'UPDATE_WEIGHT' | 'MOVE_NODE' | 'CREATE_NODE';
  projectId: string;
  nodeId: string;
  payload: any;
}

export class NetworkManager {
  private stompClient: Client | null = null;
  private projectId: string;
  private onDeltaReceived: (delta: ProjectDelta) => void;

  constructor(projectId: string, onDeltaReceived: (delta: ProjectDelta) => void) {
    this.projectId = projectId;
    this.onDeltaReceived = onDeltaReceived;
  }

  connect() {
    this.stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws-nodevix',
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      
      onConnect: () => {
        console.log('¡Conectado exitosamente al WebSocket multijugador!');
        
        // Nos suscribimos al canal de radio exclusivo de ESTE proyecto
        this.stompClient?.subscribe(`/topic/project/${this.projectId}`, (message) => {
          if (message.body) {
            const delta: ProjectDelta = JSON.parse(message.body);
            
            // Pasamos el delta recibido al frontend para que impacte la pantalla
            this.onDeltaReceived(delta);
          }
        });
      },
      
      onStompError: (frame) => {
        console.error('Error de STOMP:', frame.headers['message']);
      }
    });

    // Activa la conexión
    this.stompClient.activate();
  }

  // Método para mandar una micro-acción al servidor
  sendDelta(action: ProjectDelta['action'], nodeId: string, payload: any) {
    if (!this.stompClient || !this.stompClient.connected) {
      console.warn('No se pudo enviar el delta: WebSocket desconectado.');
      return;
    }

    console.log(`[NetworkManager] Saliendo hacia el backend -> Acción: ${action}, NodeId: ${nodeId}`, payload);

    const delta: ProjectDelta = {
      action,
      projectId: this.projectId,
      nodeId,
      payload
    };

    // Publicamos el mensaje en la ruta del `@MessageMapping` de Java
    this.stompClient.publish({
      destination: `/app/project/${this.projectId}/delta`,
      body: JSON.stringify(delta)
    });
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      console.log('WebSocket desconectado.');
    }
  }
}