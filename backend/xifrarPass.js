const bcrypt = require('bcrypt');

//Obtenir la contrasenya com a paràmetre
const contrasenyaText = process.argv[2];

//Comprovar que s'ha proporcionat la contrasenya com a paràmetre
if (!contrasenyaText) {
    console.error('Has de proporcionar la contrasenya com a paràmetre.');
    process.exit(1);
}

//Xifrar la contrasenya utilitzant bcrypt amb un hash de 10 salts
bcrypt.hash(contrasenyaText, 10, (err, contrasenyaXifrada) => {
    if (err) {
        console.error('Error en xifrar la contrasenya:', err);
        process.exit(1);
    } else {
        console.log('La contrasenya xifrada és:', contrasenyaXifrada);
        process.exit(0);
    }
});
