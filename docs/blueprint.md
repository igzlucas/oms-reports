# **App Name**: VentaYa

## Core Features:

- Store Creation and Management: Allows admin users to create new online stores and assign store owners, activate/deactivate stores.
- Product Management: Enables store owners to register, edit, and delete products with details like name, description, price, stock, category, and image (stored in Firebase Storage).
- Sales Management: Allows store owners to create sales tickets with automatic sequential numbering, calculate total sales, update stock, and store tickets in Firestore with relevant details.
- Sales Analytics Dashboard: Provides store owners with visualizations of total sales by day, week, and month, as well as profit calculations based on estimated costs.
- Login and Authentication: Allow login using username/password, or Google.
- Password Reset: Allow the user to reset their password via email.
- Intelligent Stock Alert Tool: Leverages AI to analyze sales data and predict when products are likely to run out of stock. Alerts store owners in advance via a notification to restock, minimizing potential lost sales. The AI will reason whether an alert should be triggered depending on parameters such as the user’s current inventory and normal sales figures for this time of year.

## Style Guidelines:

- Primary color: Deep sky blue (#3EB489) for trust and clarity.
- Background color: Very light cyan (#E0F4F1).
- Accent color: Soft blue (#6495ED) for interactive elements.
- Body and headline font: 'Inter', a grotesque-style sans-serif with a modern, machined, objective, neutral look.
- Simple, clean icons for navigation and product categories.
- Clean, card-based layout for products and sales data. Uses Flutter for UI.
- Subtle transitions and animations for loading and UI interactions.