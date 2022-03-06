import Funcao from './functions'
import PixModel from '../model/Pix'
import UserControl from './userController'
import BancoControl from './BancoController'
import validator from "validar-telefone"

function validaPix(pix,tipo){
    let valida = new Object()
    let aleatorio
    valida.pix = pix
    switch(tipo){
        case "cpf":
           valida.validador = Funcao.validaCpf(pix)
           return valida
        case "cnpj":
            valida.validador = Funcao.validaCnpj(pix)
            return valida
        case "email":
            valida.validador = Funcao.validaEmail(pix)
            return valida
        case "telefone":
            valida.validador = validator(pix)
            return valida
        case "aleatoria":
            aleatorio = pix.split("")
            aleatorio= aleatorio.length
            if(aleatorio!==32){
                valida.validador = false
                return valida
            }
            valida.validador = true
            return valida
    }
}

async function organizaDados(nome,email,pix,tipo,nomeBanco,codeBanco,fullNome){
    let organiza = new Object()
    let usuario= new Object()
    let banco = new Object()
    pix =await Funcao.verificajwt(pix)
    usuario.nome = nome
    usuario.email = email
    banco.nome=nomeBanco
    banco.codigo = codeBanco
    banco.nomeCompleto = fullNome
    organiza.usuario = usuario
    organiza.banco = banco
    organiza.pix = pix
    organiza.tipoPix = tipo
    return organiza
}

async function inserir(user,emailUser,pix,banco,tipo){

    let result
    let usuario = new Object()
    let buscaUser
    let buscaBanco
    let valida = validaPix(pix,tipo)
    if(valida.validador==false){
        return Funcao.padraoErro("Pix Inválido")
    }
    pix= await Funcao.encripta(pix)
    user =await Funcao.verificajwt(user)
    if(user==false){
        return Funcao.padraoErro("Usuario não identificado!!!")
    }
    result = await PixModel.create({user,emailUser,tipo,pix,banco})
    buscaUser = await UserControl.listarUm(user)
    buscaBanco = await BancoControl.listarUm(banco)
    usuario = await organizaDados(buscaUser.nome,buscaUser.email,result.pix,result.tipo,buscaBanco.nome,buscaBanco.code,buscaBanco.fullNome)
    return usuario
}
async function listar(user,emailUser){
    let pix = new Object()
    let buscaPix
    let buscaUser
    let buscaBanco
    user = await Funcao.verificajwt(user)
    if(user==false){
        return Funcao.padraoErro("Usuario não identificado!!!")
    }
    buscaPix = await PixModel.find({user,emailUser})
    pix.dados = buscaPix
    pix.tamanho = buscaPix.length
    pix.lista=buscaPix
    if(buscaPix[0]){
        for(let i = 0; i < pix.tamanho; i++){
            buscaUser = await UserControl.listarUm(user)
            buscaBanco = await BancoControl.listarUm(pix.dados[i].banco)
            pix.lista[i]= await organizaDados(buscaUser.nome,buscaUser.email,pix.dados[i].pix,pix.dados[i].tipo,buscaBanco.nome,buscaBanco.code,buscaBanco.fullNome)
        }
        return pix.lista
    }else{
        return Funcao.padraoErro("Ocorreu um erro, por favor verifique os dados.")
    }
}

async function listarUm(user,emailUser,pixBusca){
    let pix = new Object()
    let buscaPix
    let buscaUser
    let buscaBanco
    user = await Funcao.verificajwt(user)
    if(user==false){
        return Funcao.padraoErro("Usuario não identificado!!!")
    }
    buscaPix = await PixModel.find({user,emailUser})
    pix.tamanho=buscaPix.length

    if(buscaPix[0]){
        for(let i = 0; i < pix.tamanho; i++){
            pix.encript = buscaPix[i].pix
            buscaPix[i].pix=await Funcao.verificajwt(buscaPix[i].pix)
            if(buscaPix[i].pix == pixBusca){
                buscaUser = await UserControl.listarUm(user)
                buscaBanco = await BancoControl.listarUm(buscaPix[i].banco)
                pix.dados= await organizaDados(buscaUser.nome,buscaUser.email,pix.encript,buscaPix[i].tipo,buscaBanco.nome,buscaBanco.code,buscaBanco.fullNome)
            }else{
                pix.dados = Funcao.padraoErro("pix não encontrado.")
            }
        }
        return pix.dados
    }else{
        return Funcao.padraoErro("Email inválido.")
    }
}

async function excluirId(user,email,pix){
    let pixBanco
    let buscaPix
    let tamanho
    user =await Funcao.verificajwt(user)
    if(user==false){
        return Funcao.padraoErro("Usuario não identificado!!!")
    }
    buscaPix = await PixModel.find({user,email})
    tamanho =buscaPix.length
    for(let i = 0; i < tamanho; i++){
        pixBanco =  await Funcao.verificajwt(buscaPix[i].pix)
        if(pix==pixBanco){
            await PixModel.findByIdAndDelete(buscaPix[i]._id)
        }
    }
    buscaPix = await PixModel.find({user,email})
    tamanho =buscaPix.length
    return tamanho
}
async function editar(user,email,pixAntigo,pixNovo,tipo,banco){
    let valida = validaPix(pixNovo,tipo)
    if(valida.validador==false){
        return Funcao.padraoErro("Pix Inválido")
    }
    let pix = new Object()
    let buscaPix
    let userEncript = user
    user = await Funcao.verificajwt(user)
    if(user==false){
        return Funcao.padraoErro("Usuario não identificado!!!")
    }
    buscaPix = await PixModel.find({user,email})
    pix.tamanho=buscaPix.length
    pix.novo = await Funcao.encripta(pixNovo)

    if(buscaPix[0]){
        for(let i = 0; i < pix.tamanho; i++){
            pix.encript = buscaPix[i].pix
            buscaPix[i].pix=await Funcao.verificajwt(buscaPix[i].pix)
            if(buscaPix[i].pix == pixAntigo){
                
                await PixModel.findOneAndUpdate({user,email,pix:pix.encript},{pix:pix.novo,tipo,banco})
                pix.dados = await listarUm(userEncript,email,pixNovo)
                return pix.dados
            }else{
                pix.dados = Funcao.padraoErro("pix não encontrado.")
            }
        }
        return pix.dados
    }else{
        return Funcao.padraoErro("Email inválido.")
    }

}
function teste(pix,tipo){
    pix= validaPix(pix,tipo)
    return pix
}


module.exports = {inserir,listar,listarUm,excluirId,editar,teste}