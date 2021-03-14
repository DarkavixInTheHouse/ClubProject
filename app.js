const express = require("express")
const bodyParser = require("body-parser")
const path = require("path")
const db = require("better-sqlite3")("main.db")
const app = express()
const session = require('express-session')

app.set("views", __dirname + "/views")
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, "public")))

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))

app.get("/", (req, res) => {
    res.render("main")
})

let baseApiUrl = "/api/v1/"

app.get(baseApiUrl + "users/:id", async (req, res) => {
    let id = Number(req.params.id)
    if (!id) return res.send({
        error: true,
        msg: "Bad Request!",
        data: [],
    })
    let data = await db.prepare("SELECT id, firstname, lastname, studentnumber, club, class FROM users WHERE studentnumber = ?").get(id)
    if (!data) return res.send({
        error: true,
        msg: "ไม่พบนักเรียนนี้!",
        data: [],
    })
    res.send({
        error: false,
        msg: "Good Job!",
        data,
    })
})

app.get(baseApiUrl + "clubs/all", async (req, res) => {
    let limit = Number(req.query.limit)
    if (!limit || limit == NaN || limit <= 0) {
        let data = await db.prepare("SELECT id, name, firstname_teacher, lastname_teacher, max FROM clubs ORDER BY id").all()
        for (let obj of data) {
            let users = await db.prepare("SELECT * FROM users WHERE club = " + obj.id).all()
            obj["min"] = users.length
        }
        res.send({
            error: false,
            msg: "Good Job!",
            data,
        })
    } else {
        let data = await db.prepare("SELECT id, name, firstname_teacher, lastname_teacher, max FROM clubs ORDER BY id LIMIT " + limit).all()
        for (let obj of data) {
            let users = await db.prepare("SELECT * FROM users WHERE club = " + obj.id).all()
            obj["min"] = users.length
        }
        res.send({
            error: false,
            msg: "Good Job!",
            data,
        })
    }
})

app.get(baseApiUrl + "clubs/:id", async (req, res) => {
    let id = Number(req.params.id)
    if (!id) return res.send({
        error: true,
        msg: "Bad Request!",
        data: [],
    })
    let data = await db.prepare("SELECT id, name, firstname_teacher, lastname_teacher, max FROM clubs WHERE id = ?").get(id)
    if (!data) return res.send({
        error: true,
        msg: "ไม่พบชุมนุมนี้!",
        data: [],
    })
    res.send({
        error: false,
        msg: "Good Job!",
        data,
    })
})

app.post(baseApiUrl + "clubs/joinclub", async (req, res) => {
    let id = Number(req.body.id)
    let cid = Number(req.body.cid)
    if (!id || !cid) return res.send({
        error: true,
        msg: "Bad Request!",
        data: [],
    })
    let user = await db.prepare("SELECT * FROM users WHERE id = ?").get(id)
    if(!user) return res.send({
        error: true,
        msg: "ไม่พบนักเรียนนี้!",
        data: [],
    })
    if(!user.club == null || !user.club == 0) return res.send({
        error: true,
        msg: "คุณมีชุมนุมอยู่แล้ว!",
        data: [],
    })
    let club = await db.prepare("SELECT * FROM clubs WHERE id = ?").get(cid)
    if(!club) return res.send({
        error: true,
        msg: "ไม่พบชุมนุมนี้!",
        data: [],
    })
    let users = await db.prepare("SELECT * FROM users WHERE club = " + club.id).all()
    if(users.length >= club.max) return res.send({
        error: false,
        msg: "ชุมนุมนี้เต็มแล้ว!",
        data: [],
    })
    let update = db.prepare("UPDATE users SET club = :cid WHERE id = :id").run({
        cid: club.id,
        id: user.id
    })
    if (!update) return res.send({
        error: true,
        msg: "ไม่สามารถเข้าชุมนุมได้!",
        data: [],
    })
    res.send({
        error: false,
        msg: "เข้าชุมนุมสำเร็จ!",
        data: [],
    })
})

app.listen(80, () => {
    console.log("Listening to port 80!")
})