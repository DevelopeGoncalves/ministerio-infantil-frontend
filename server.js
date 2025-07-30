// server.js
require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000; // Usa a porta do ambiente (do Render) ou 3000 por padrão

// Configuração do pool de conexão com o PostgreSQL
// A string de conexão virá da variável de ambiente DATABASE_URL no Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        // Necessário para conexões SSL com o Render (e outros serviços de cloud)
        // Se você testar localmente sem SSL, pode remover ou ajustar isso.
        rejectUnauthorized: false
    }
});

// Middleware para permitir JSON no corpo das requisições
app.use(express.json({ limit: '50mb' }));
// Middleware para permitir requisições de outras origens (CORS)
// Permite que seu frontend (do GitHub Pages) se comunique com este backend.
app.use(cors());

// Rota para verificar se o servidor está funcionando
app.get('/', (req, res) => {
    res.send('Servidor do Ministério Infantil está online! 🎉');
});

// Rota para obter todas as crianças cadastradas
app.get('/children', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM children ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar crianças:', err);
        res.status(500).json({ message: 'Erro ao buscar crianças', error: err.message });
    }
});

// Rota para cadastrar uma nova criança
app.post('/children', async (req, res) => {
    const { childName, dob, age, room, guardianName, guardianPhone, photo } = req.body;
    if (!childName || !dob || !age || !room || !guardianName || !guardianPhone) {
        return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO children (childName, dob, age, room, guardianName, guardianPhone, photo) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [childName, dob, age, room, guardianName, guardianPhone, photo]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao cadastrar criança:', err);
        res.status(500).json({ message: 'Erro ao cadastrar criança', error: err.message });
    }
});

// Rota para excluir uma criança por ID
app.delete('/children/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM children WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Criança não encontrada.' });
        }
        res.json({ message: 'Criança removida com sucesso!', deletedChild: result.rows[0] });
    } catch (err) {
        console.error('Erro ao remover criança:', err);
        res.status(500).json({ message: 'Erro ao remover criança', error: err.message });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});