GRANABANK
=========

1. Como correr el proyecto
--------------------------

Requisitos
- Node.js 22.12 o superior (lo probé con Node 24) y npm.
- Docker Desktop para la base de datos. También sirve un PostgreSQL 17 propio, cambiando
  las URLs del archivo .env.

Desde la carpeta del proyecto:

  cp .env.example .env            
  npm ci
  docker compose up -d --wait
  npm run db:deploy
  npm run db:seed
  npm run dev

La app queda en http://localhost:3000.


2. Decisiones tecnicas
----------------------

Arquitectura
- Use el App Router de Next.js con componentes de servidor. Las páginas consultan la base
  en el servidor y el navegador recibe el HTML listo. Solo los formularios, los filtros,
  el diálogo de transferencia y el menu son componentes de cliente.
- Las páginas privadas están en un grupo de rutas, (bank), cuyo layout exige sesion. Asi
  ninguna pagina privada depende de acordarse de verificar la sesion por su cuenta.
- Las operaciones que cambian datos (login, logout y transferir) son API routes. 

Base de datos y dinero
- PostgreSQL con Prisma 7: tipos generados a partir del schema, migraciones versionadas y transacciones.
- Los montos se guardan en centavos enteros, nunca con decimales, para evitar errores de redondeo. 

Transferencias
- El debito es condicional: solo descuenta si el saldo alcanza. Eso evita saldos negativos aunque lleguen dos transferencias al mismo tiempo.
- Cada operacion lleva un identificador unico que se genera al abrir el formulario y seusa como clave de la tabla Transfer. 
 Si el pedido se repitela base lo rechaza y la API responde que la operación ya se hizo.

Autenticación y sesiones
- Preferi implementar las sesiones yo mismo en lugar de librerias como Auth.js por ser un entorno de prueba
- La cookie lleva un token aleatorio y es HttpOnly, SameSite=lax y Secure en producción. La base de datos guarda solo el hash del token
- Las contraseñas se guardan con bcrypt. Si el email no existe, igual se compara contra un hash ficticio para que la respuesta tarde lo mismo y no revele que emails estan
  registrados.
- El login admite hasta 10 intentos cada 15 minutos por email. El contador está en la base para que funcione aunque haya varias instancias del servidor.
- Los POST verifican el encabezado Origin contra APP_URL, para evitar que otro sitio haga operaciones con la sesión del usuario (CSRF).
- La sesión vence a los 15 minutos sin actividad y nunca dura mas de 8 horas. La cookie no tiene fecha de vencimiento, asi que se borra al cerrar el navegador. Si la sesion vence,
 el login lo avisa.
- "Recuerdame" guarda solo el email y solo en ese navegador. Nunca la contraseña.

Interfaz
- El historial se trae completo y se filtra en el navegador. 
- Estilos en CSS propio con variables de diseño separados por area. 
- Las fechas se calculan y muestran en la zona horaria de Buenos Aires.
- Las fuentes se cargan con next/font: se sirven desde el propio sitio y no mueven el contenido al cargar.

Calidad y herramientas
- TypeScript en modo estricto, ESLint con la configuración de Next y Prettier.
- Pruebas unitarias con node:test, sin configurar Jest, y una prueba de integracion que recorre la app real contra PostgreSQL: rutas privadas, vencimiento de sesion,
 transferencias, duplicados, concurrencia, conservacion del dinero, logout y limite de intentos.
- Docker Compose para la base, asi no hace falta instalar PostgreSQL.



3. Lo que mejoraria con mas tiempo
-------------------------------

- Filtrar el historial en la base (paginación por cursor) en lugar de traerlo completo.
- Un paso de confirmacion antes de transferir, con el resumen de la operacion, y una agenda de destinatarios frecuentes.
- Seguridad: segundo factor de autenticacion, recuperacion de contraseña y limite de intentos también por IP. Ahora mismo el limite es solo
 por email, lo que permite bloquear temporalmente la cuenta de otra persona.
- Reforzar el modelo de datos: relacionar cada movimiento con su transferencia por clave foranea y agregar una restricción en la base para que el
 saldo nunca pueda ser negativo, como segunda barrera ademas de la logica.
- Una capa de acceso a datos entre las paginas y Prisma, para no repetir consultas y poder probarlas por separado.
- Logs estructurados y seguimiento de errores.
- Formularios con Server Actions para que funcionen incluso sin JavaScript.
- Exportar el CSV con coma decimal, que es lo que espera Excel en español.
- Registro de usuarios, mas de una cuenta por usuario y cuentas en dolares.
