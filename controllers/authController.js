const User = require("../models/User")
const LaboralData = require('../models/LaboralData')
const PerfilData = require('../models/PerfilData')
const Plantilla = require('../models/Plantilla')
const PersonalData = require('../models/PersonalData')
const DescripcionData = require('../models/DescripcionData')
const {validationResult} = require('express-validator')
const randomId = require('random-id');
const bcrypt = require('bcryptjs')
const nodemailer = require("nodemailer")
require('dotenv').config()

//Render Form Registro
const registerForm = (req, res)=>{
    res.render('register')
}

//Render Form Login
const loginForm = (req, res)=>{
    res.render('login')
}

//Registro de usuarios
const registerUser = async(req, res)=>{

    const errors = validationResult(req)
    if(!errors.isEmpty()){
        req.flash("mensajes", errors.array())
        return res.redirect('/auth/register')
    }
    const {email, password} = req.body
    var patr贸n = 'aA0'
    var largo = 30;

    try{
        let user = await User.findOne({email:email})
        if(user) throw new Error("Ya existe un usuario registrado con ese Email")
        
        user = new User({email, password, tokenConfirm: randomId(largo, patr贸n)})
        await user.save()

        //Env铆a correo de confirmaci贸n
        const transport = nodemailer.createTransport({
            host: "smtp.mailtrap.io",
            port: 2525,
            auth: {
            user: "300b9ef3b1b13e",
            pass: "a2f7ffdebdab15"
            }
        });
        
        await transport.sendMail({
            from: '"馃敼 FreeCVMaker 馃敼" <FreeCVMaker@example.com>',
            to: user.email,
            subject: "Verific谩 tu correo electr贸nico",
            html: `<h2>Gracias por registrarte en FreeCVMaker<h2/>
                    <h2>Ya casi pod茅s comenzar a crear tu CV, primero activ谩 tu cuenta.
                    <p>Para activar tu cuenta necesitamos que valides tu correo electr贸nico haciendo click aqu铆:</p>
                    <a href="http://localhost:3000/auth/confirmar/${user.tokenConfirm}">Verificar cuenta</a>
                    <br><br><p>Atentamente,</p><p>Equipo FreeCVMaker!馃挅</p>`,
        });

        req.flash("mensajes", 
        [{msg: "Necesit谩s activar tu cuenta, por favor revis谩 tu correo electr贸nico y accede al link de confirmaci贸n que te hemos enviado"}])

        res.redirect('/auth/login')
    }
    catch(error){
        req.flash("mensajes", [{msg: error.message}])
        return res.redirect('/auth/register')
    }
}

//Confirmarcion de cuenta a trav茅s de un Token
const confirmarCuenta = async (req, res)=>{
    const {token} = req.params
    try{
        const user = await User.findOne({tokenConfirm: token})
        if(!user) throw new Error("Usuario inv谩lido")

        user.cuentaConfirmada = true
        user.tokenConfirm = null

        await user.save()

        req.flash("mensajes", 
        [{msg: "Cuenta activada, ya pod茅s iniciar sesi贸n"}])

        res.redirect('/auth/login')
    }
    catch(error){
        req.flash("mensajes", [{msg: error.message}])
        return res.redirect('/auth/login')
    }
}


//Iniciar sesion Usuarios
const loginUser = async(req, res)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        req.flash("mensajes", errors.array())
        return res.redirect('/auth/login')
    }

    const {email, password} = req.body
    try{
        const user = await User.findOne({email})
        if(!user) throw new Error("No existe un usuario registrado con ese Email")
    
        if(!user.cuentaConfirmada) throw new Error ("Por favor, verifique su cuenta")
        
        //if(!(await user.comparePassword(password))) 
        if( user.password !=(password)) 
            throw new Error ("Contrase帽a incorrecta")

        req.login(user, function(err){
            if(err) throw new Error('Error al crear la sesi贸n')
            res.redirect('/home')
        })
    }
    catch(error){
        req.flash("mensajes", [{msg: error.message}])
        return res.redirect('/auth/login')
    }
}

//Cerrar sesi贸n
const cerrarSesion = (req, res)=>{
    req.logout(function(err){
        if(err){
            return next(err)
        }
        res.redirect('/auth/login')
        req.flash("mensajes", [{msg: "Sesi贸n cerrada"}])
    })
}


//Formulario de Reestablecer Password y envio de email de reestablecer
const enviarResetPass = async(req, res)=>{
    const {email} = req.body
    try{
        
        const user = await User.findOne({email})
        if(!user) throw new Error("No existe un usuario registrado con ese Email")

        //Env铆a correo de reset
        const transport = nodemailer.createTransport({
            host: "smtp.mailtrap.io",
            port: 2525,
            auth: {
            user: "300b9ef3b1b13e",
            pass: "a2f7ffdebdab15"
            }
        });
        
        await transport.sendMail({
            from: '"馃敼 FreeCVMaker 馃敼" <FreeCVMaker@example.com>',
            to: user.email,
            subject: "Reestablecer contrase帽a",
            html: `<h2>FreeCVMaker<h2>
                    <h2>Reestablec茅 tu contrase帽a<h2>
                    <p>Para hacerlo hac茅 click aqu铆:</p>
                    <a href="http://localhost:3000/auth/reestablecerPassword/${user._id}">Reestablecer mi contrase帽a</a>
                    <br><br><p>Atentamente,</p><p>Equipo FreeCVMaker!馃挅</p>`,
        });

        req.flash("mensajes", 
        [{msg: "Por favor, revise su correo electr贸nico para reestablecer su contrase帽a"}])

        res.redirect('/auth/login')
    }
    catch(error){
        req.flash("mensajes", [{msg: error.message}])
        return res.redirect('/auth/rememberPass')
    }
}


//Guarda la nueva Password
const guardarNuevaPass = async(req, res)=>{
    const {id} = req.params
    const {password} = req.body

    const errors = validationResult(req)
    if(!errors.isEmpty()){
        req.flash("mensajes", errors.array())
        return res.redirect(`/auth/reestablecerPassword/${id}`)
    }
    try{
        const user = await User.findById(id)
        if(!password){
            throw new Error("Debe escribir una nueva contrase帽a")
        }

        await user.updateOne({password})
        req.flash("mensajes", [{msg: "Su contrase帽a ha sido reestablecida"}])
        res.redirect('/auth/login')
    }
    catch(error){
        req.flash("mensajes", [{msg: error.message}])
        return res.redirect(`/auth/reestablecerPassword/${id}`)
    }
}


//Formulario de eliminar cuenta
const eliminarCuenta = async(req, res)=>{
    const {id} = req.params
    try{
        const user = await User.findOne(id)
        res.render(`eliminarCuenta`)
    }
    catch(error){
        req.flash("mensajes", [{msg: error.message}])
        return res.redirect('/datosPersonales/verMisDatos')
    }
}


//Elimina cuenta segun el ID
const confirmEliminar = async(req, res)=>{
    const {id} = req.params
    try{
        await User.deleteOne(id)
        const datosDescripcion = await DescripcionData.deleteOne(id)
        const personaldatas = await PersonalData.deleteOne(id) 
        const laboralData = await LaboralData.deleteOne(id)
        const descripcionData = await DescripcionData.deleteOne(id)
        const plantilla = await Plantilla.deleteOne(id)
        const perfil = await PerfilData.deleteOne(id)
        
        req.logout(function(err){
            if(err){
                return next(err)
            }
        req.flash("mensajes", [{msg: "Datos eliminados correctamente"}])
        res.redirect('/')
        })
    }
    catch(error){
    req.flash("mensajes", [{msg: error.message}])
    return res.redirect('/datosPersonales/verMisDatos')
    }
}


module.exports = {
    registerForm,
    registerUser,
    confirmarCuenta,
    loginForm,
    loginUser,
    cerrarSesion,
    eliminarCuenta,
    enviarResetPass,
    guardarNuevaPass,
    confirmEliminar
}