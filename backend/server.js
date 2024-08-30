//Importar mòduls necessaris
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'testkey';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

//Configurar directori temporal per a l'àudio
const tempAudioDir = path.join(__dirname, 'tempaudio');
if (!fs.existsSync(tempAudioDir)) {
    fs.mkdirSync(tempAudioDir);
}

//Connectar base de dades a SQLite
const db = new sqlite3.Database('./TFGdb.db', (err) => {
    if (err) {
        console.error('Error al connectar la base de dades', err);
    } else {
        console.log('Connectat a la base de dades amb èxit!');
    }
});

//Obtenir tota la llista de cançons
app.get('/api/cancons', (req, res) => {
    const sqlObtenirCancons = 'SELECT * FROM cancons';
    db.all(sqlObtenirCancons, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

//Obtenir tots els entrenaments
app.get('/api/entrenaments', (req, res) => {
    const sqlConsultaEntrenaments = 'SELECT * FROM entrenaments';
    db.all(sqlConsultaEntrenaments, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

//Obtenir entrenaments per a un alumne específic(a partir de l'ID de l'alumne)
app.get('/api/entrenaments-alumne', (req, res) => {
    const { iduser } = req.query;
    const sqlConsultaEntrenamentsAlumne = `SELECT entrenaments.* 
                                            FROM entrenaments 
                                            JOIN userentr ON entrenaments.id = userentr.identre 
                                            WHERE userentr.iduser = ?`;
    db.all(sqlConsultaEntrenamentsAlumne, [iduser], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

//Obtenir la taula d'un entrenament en concret a partir de l'ID
app.get('/api/entrenament/:id', (req, res) => {
    const { id } = req.params;
    console.log('Buscant detalls per a l\'entrenament amb ID:', id);
  
    //Consulta per a obtenir les activitats d'un entrenament
    const sqlConsultaActivitats = `SELECT activitats.idactivitat, activitats.temps, activitats.intensitat, GROUP_CONCAT(cancons.titol, ', ') as cancons
                                    FROM activitats
                                    JOIN ordre ON activitats.idactivitat = ordre.idact AND activitats.identrenament = ordre.identre
                                    JOIN cancons ON ordre.idcanco = cancons.id
                                    WHERE activitats.identrenament = ?
                                    GROUP BY activitats.idactivitat, activitats.temps, activitats.intensitat
                                    ORDER BY activitats.idactivitat`;
    db.all(sqlConsultaActivitats, [id], (err, rows) => {
        if (err) {
            res.status(400).json({ error: `Error buscant activitats: ${err.message}` });
            return;
        }
        res.json({ activities: rows });
    });
});

//Obtenir les cançons per a la intensitat seleccionada
app.get('/api/cancoINT', (req, res) => {
    const { intensitat } = req.query;
    if (!intensitat) {
        res.status(400).json({ error: 'Intensitat no proporcionada' });
        return;
    }

    const sqlObtenirCancons = 'SELECT * FROM cancons WHERE intensitat = ?';
    db.all(sqlObtenirCancons, [intensitat], (err, rows) => {
        if (err) {
            res.status(400).json({ error: `Error en la consulta de cançons: ${err.message}` });
            return;
        }
        res.json(rows);
    });
});
    
//Afegir un nou entrenament a la base de dades
app.post('/api/entrenament', (req, res) => {
    console.log('Sol·licitud rebuda:', req.body);  
    const { nom, activitats } = req.body;

    //Calcular la duració total de l'entrenament
    const duracio = activitats.reduce((total, activitat) => total + activitat.temps, 0);

    const sqlInserirEntrenament = 'INSERT INTO entrenaments (nom, duracio) VALUES (?, ?)';

    //Inserir l'entrenament
    db.run(sqlInserirEntrenament, [nom, duracio], function (err) {
        if (err) {
            res.status(400).json({ error: `Error en crear l\'entrenament: ${err.message}` });
            return;
        }
        const idEntrenament = this.lastID;
        let idactivitat = 1;
        //Inserir les activitats de l'entrenament
        const sqlInserirActivitats = 'INSERT INTO activitats (identrenament, idactivitat, temps, intensitat) VALUES (?, ?, ?, ?)';
        for (const activitat of activitats) {
            db.run(sqlInserirActivitats, [idEntrenament, idactivitat, activitat.temps, activitat.intensitat], function (err) {
                if (err) {
                    res.status(400).json({ error: `Error en crear activitat: ${err.message}` });
                    return;
                }
            });
            idactivitat++;
        }
        res.status(201).json({ id: idEntrenament, message: `Entrenament creat amb èxit amb l'ID: ${idEntrenament}` });
    });
});

//Inserir registres a la taula ordre (segona part d'inserir entrenament)
app.post('/api/ordre', (req, res) => {
    const { identre, idact, idcanco, ordre } = req.body;
    console.log('Dades rebudes per inserir en ordre:', { identre, idact, idcanco, ordre });

    const sqlInserirOrdre = 'INSERT INTO ordre (identre, idact, idcanco, ordre) VALUES (?, ?, ?, ?)';
    db.run(sqlInserirOrdre, [identre, idact, idcanco, ordre], (err) => {
        if (err) {
            console.error(`Error al inserir ordre: ${err.message}`);
            res.status(500).json({ error: `Error al inserir ordre: ${err.message}` });
            return;
        }
        res.json({ message: 'Ordre inserit amb èxit' });
    });
});

//Eliminar un entrenament
app.delete('/api/entrenament/:id', (req, res) => {
    const { id } = req.params;
    const sqlEliminarEntrenament = 'DELETE FROM entrenaments WHERE id = ?';
    const sqlEliminarActivitats = 'DELETE FROM activitats WHERE identrenament = ?';
    const sqlEliminarOrdre = 'DELETE FROM ordre WHERE identre = ?';
    const sqlEliminarUserEntr = 'DELETE FROM userentr WHERE identre = ?';

    //Eliminar l'entrenament, les seves activitats, l'ordre de les cançons i els registres d'userentr
    db.serialize(() => {
        db.run(sqlEliminarEntrenament, [id], (err) => {
            if (err) {
                res.status(400).json({ error: `Error en eliminar l'entrenament: ${err.message}` });
                return;
            }
            db.run(sqlEliminarActivitats, [id], (err) => {
                if (err) {
                    res.status(400).json({ error: `Error en eliminar activitats: ${err.message}` });
                    return;
                }
                db.run(sqlEliminarOrdre, [id], (err) => {
                    if (err) {
                        res.status(400).json({ error: `Error en eliminar l'ordre: ${err.message}` });
                        return;
                    }
                    db.run(sqlEliminarUserEntr, [id], (err) => {
                        if (err) {
                            res.status(400).json({ error: `Error en eliminar userentr: ${err.message}` });
                            return;
                        }
                        res.json({ message: 'Entrenament eliminat amb èxit' });
                    });
                });
            });
        });
    });
});

//Descarregar àudio de YouTube i analitzar-lo per obtenir els BPM i la duració
app.post('/api/buscar-canco', (req, res) => {
    const { url } = req.body;
    const outputFilename = `audio`;
    const outputPath = path.join('tempaudio', outputFilename);

    //Crear la comanda per descarregar l'àudio
    console.log('Descarregant àudio de:', url, 'a:', outputPath);
    const descarregarAudio = `python descarregarAudio.py ${url} ${outputPath}`;
    
    //Cridar a l'script de Python per descarregar l'àudio a partir de la comanda
    exec(descarregarAudio, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error en descarregar l'àudio: ${error}`);
            return res.status(500).json({ error: `Error en descarregar l'àudio` });
        }

        //Crear la comanda per analitzar l'àudio i obtindre el títol del vídeo a partir de la sortida de la descàrrega
        console.log('Àudio descarregat correctament, iniciant anàlisi...');
        const analitzarAudio = `python analitzarAudio.py ${outputPath}.mp3`;
        const titolVideo = stdout.split("\n").slice(-2, -1)[0]
        //Cridar a l'script de Python per analitzar l'àudio a partir de la comanda
        exec(analitzarAudio, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error en analitzar l'àudio: ${error}`);
                return res.status(500).json({ error: `Error en analitzar l'àudio` });
            }

            const resultatAnalisis = JSON.parse(stdout);
            if (resultatAnalisis.error) {
                console.error(`Error en l'anàlisi de l'àudio: ${resultatAnalisis.error}`);
                return res.status(500).json({ error: resultatAnalisis.error });
            }

            const { bpm, duracio } = resultatAnalisis;
            console.log('Resultats de l\'anàlisi:', resultatAnalisis);
            
            //Eliminar l'àudio descarregat
            fs.unlink(`${outputPath}.mp3`, (unlinkError) => {
                if (unlinkError) {
                    console.error(`Error en eliminar el fitxer d'àudio: ${unlinkError}`);
                } else {
                    console.log('Fitxer d\'àudio eliminat correctament');
                }
            });

            //Retornar els resultats de l'anàlisi
            res.json({
                message: 'Àudio descarregat i analitzat',
                path: outputPath,
                bpm,
                duracio,
                titol: titolVideo,
            });
        });
    });
});

//Inserir cançó a la base de dades
app.post('/api/pujar-canco', (req, res) => {
    const { titol, duracio, bpm, intensitat, artista, link } = req.body;

    //Comprovar que els camps obligatoris estiguin complets
    if (!titol || !artista || !duracio) {
        return res.status(400).json({ error: 'Títol, artista i duració són camps obligatoris.' });
    }

    const sqlInserirCanco = `INSERT INTO cancons (titol, duracio, bpm, intensitat, artista, link) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sqlInserirCanco, [titol, duracio, bpm, intensitat, artista, link], function(err) {
        if (err) {
            console.error(`Error en inserir la cançó: ${err.message}`);
            return res.status(500).json({ error: 'Error en inserir la cançó a la base de dades.' });
        }
        res.json({ message: 'Cançó pujada amb èxit.', id: this.lastID });
    });
});

//Obtenir l'ordre de les cançons d'un entrenament
app.get('/api/reproduirEntrenament/:id/', (req, res) => {
    const { id } = req.params;

    //Consulta per a obtenir l'ordre de les cançons d'un entrenament
    const sqlConsultaOrdre = `SELECT activitats.idactivitat, activitats.intensitat, ordre.ordre, cancons.link 
                                FROM activitats
                                JOIN ordre ON activitats.idactivitat = ordre.idact AND activitats.identrenament = ordre.identre
                                JOIN cancons ON ordre.idcanco = cancons.id
                                WHERE activitats.identrenament = ?
                                ORDER BY activitats.idactivitat, ordre.ordre;`;
    db.all(sqlConsultaOrdre, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

//Login de l'usuari
app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;
    const sqlConsultaUser = 'SELECT * FROM usuaris WHERE user = ?';
    db.get(sqlConsultaUser, [user], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            //Comprovar el hash de la contrasenya
            bcrypt.compare(pass, row.pass, (err, isMatch) => {
                if (err) {
                    res.status(500).json({ error: 'Error al verificar la contrasenya' });
                    return;
                }
                if (isMatch) {
                    //Generar token JWT amb l'ID i el rol de l'usuari si la contrasenya és correcta
                    const token = jwt.sign({ id: row.id, rol: row.rol }, SECRET_KEY);
                    res.json({ token, rol: row.rol });
                } else {
                    res.status(401).json({ error: 'Contrasenya incorrecta.' });
                }
            });
        } else {
            res.status(401).json({ error: 'Usuari o contrasenya incorrectes.' });
        }
    });
});

//Obtenir usuaris amb rol "alumne" que no tenen l'entrenament assignat
app.get('/api/usuaris-alumnes/:identre', (req, res) => {
    const { identre } = req.params;
    const sqlObtenirAlumnes = `SELECT * FROM usuaris
                                WHERE rol = "alumne"
                                AND id NOT IN (SELECT iduser FROM userentr WHERE identre = ?)`;
    db.all(sqlObtenirAlumnes, [identre], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

//Obtenir usuaris amb rol "alumne" que tenen l'entrenament assignat
app.get('/api/usuaris-assignats/:identre', (req, res) => {
    const { identre } = req.params;
    const sqlObtenirAssignats = `
        SELECT usuaris.* FROM usuaris
        JOIN userentr ON usuaris.id = userentr.iduser
        WHERE userentr.identre = ?
    `;
    db.all(sqlObtenirAssignats, [identre], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

//Inserir IDs d'alumne i entrenament a la taula userentr
app.post('/api/assignar-entrenament', (req, res) => {
    const { iduser, identre } = req.body;
    const sqlAssignarEntrenament = 'INSERT INTO userentr (iduser, identre) VALUES (?, ?)';
    db.run(sqlAssignarEntrenament, [iduser, identre], (err) => {
        if (err) {
            res.status(500).json({ error: `Error assignant entrenament: ${err.message}` });
            return;
        }
        res.json({ message: 'Entrenament assignat amb èxit' });
    });
});

//Eliminar assignació de l'entrenament a un alumne
app.delete('/api/desassignar-entrenament/:iduser/:identre', (req, res) => {
    const { iduser, identre } = req.params;
    const sqlDesassignarEntrenament = 'DELETE FROM userentr WHERE iduser = ? AND identre = ?';
    db.run(sqlDesassignarEntrenament, [iduser, identre], (err) => {
        if (err) {
            res.status(500).json({ error: `Error desassignant entrenament: ${err.message}` });
            return;
        }
        res.json({ message: 'Entrenament desassignat amb èxit' });
    });
});

//Iniciar el servidor
app.listen(PORT, () => { 
    console.log(`Servidor en funcionament al port http://localhost:${PORT}`);
});
