const express = require('express');
const connect = require('./config/db')
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const authRoutes = require('./routes/authRoute');
const nftRoutes = require('./routes/ntfRoutes')



const app = express();
const PORT = process.env.PORT || 3000;

const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'NFTify',
        version: '1.0.0',
      },
    },
    apis: ['./routes/*.js'],
  };
  
  const specs = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use(cors())
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/' , nftRoutes);


app.listen(PORT, async() => {
    await connect()
    console.log(`Server is running on port ${PORT}`);
});
