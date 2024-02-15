const express = require('express');
const connect = require('./config/db')
const authRoutes = require('./routes/authRoute');
const nftRoutes = require('./routes/ntfRoutes')
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/auth', authRoutes);
app.use('/' , nftRoutes);


app.listen(PORT, async() => {
    await connect()
    console.log(`Server is running on port ${PORT}`);
});
