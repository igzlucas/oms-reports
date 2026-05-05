# PowerGirl con Firebase Studio

Este es un proyecto de Next.js creado en Firebase Studio. Es una plataforma inteligente de gestión de tiendas, productos, ventas y análisis de rentabilidad.

## Cómo Ejecutar Localmente

Sigue estos pasos para configurar y ejecutar el proyecto en tu máquina local.

### Requisitos Previos

- **Node.js:** Versión `20.x` o superior.
- **npm:** (o `yarn`/`pnpm`) - Generalmente se instala junto con Node.js.
- **Proyecto de Firebase:** Necesitarás tener un proyecto de Firebase para obtener las claves de configuración.

### Pasos de Instalación

1.  **Clonar el Repositorio**
    Si aún no lo has hecho, clona el repositorio en tu máquina local.

2.  **Instalar Dependencias**
    Navega al directorio raíz del proyecto y ejecuta el siguiente comando para instalar todos los paquetes necesarios:
    ```bash
    npm install
    ```

3.  **Configurar las Variables de Entorno**
    El proyecto necesita las credenciales de tu proyecto de Firebase para funcionar. En el archivo `.env` de la raíz del proyecto, reemplaza los valores de ejemplo `<...>` con las credenciales reales de tu proyecto de Firebase.

    Puedes encontrar estas credenciales en la configuración de tu proyecto en la consola de Firebase (Project Settings > General > Your apps > SDK setup and configuration).

    ```env
    # Variables de Entorno de Firebase
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="<your-project-id>"
    NEXT_PUBLIC_FIREBASE_APP_ID="<your-app-id>"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="<your-storage-bucket>"
    NEXT_PUBLIC_FIREBASE_API_KEY="<your-api-key>"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="<your-auth-domain>"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="<your-messaging-sender-id>"
    ```

    **Importante:** No subas tus claves reales a un repositorio público. El archivo `.env` está incluido en `.gitignore` para prevenir esto.

4.  **Ejecutar el Servidor de Desarrollo**
    ¡Ya está todo listo! Ejecuta el siguiente comando para iniciar la aplicación:
    ```bash
    npm run dev
    ```
    La aplicación debería estar disponible en `http://localhost:9002`.

### Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo de Next.js.
- `npm run build`: Compila la aplicación para producción.
- `npm run start`: Inicia un servidor de producción después de compilar.
- `npm run lint`: Ejecuta el linter de código.
