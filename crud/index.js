const path = require("path");
const express = require("express");
const app = express();
const dotenv = require("dotenv").config();

//mongodb관련 모듈
const MongoClient = require("mongodb").MongoClient;

let db = null;
MongoClient.connect(process.env.MONGO_URL, { useUnifiedTopology: true }, (err, client) => {
  console.log("연결");
  if (err) {
    console.log(err);
  }
  db = client.db("crudapp");
});

app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.send("hello node crud");
});

app.get("/write", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html/write.html"));
});

//post는 데이터 밀어넣을때 get은 데이터 뿌릴 때
app.post("/add", (req, res) => {
  const subject = req.body.subject;
  const contents = req.body.contents;
  console.log(subject);
  console.log(contents);
  // insert delete update select - sql crud
  const insertData = {
    subject: subject,
    contents: contents,
  };
  db.collection("crud").insertOne(insertData, (err, result) => {
    if (err) {
      console.log(err);
    }
    console.log("잘 들어감");
  });

  //0.db만들기 1. db접속 2.데이터 밀어넣기

  // db (oracle, mysql ,) rdbms
  // nosqul -> mongodb

  //res.sendFile(path.join(__dirname, "public/html/result.html"));
  res.send(`<script>alert("경고창"); location.href="/list"</script>`);
  // res.redirect("/list");
  //가자마자 list페이지로 보냄
});
app.get("/list", (req, res) => {
  //db(crud 라는 컬렉션에서 데이터 받기 > )
  db.collection("crud")
    .find()
    .toArray((err, result) => {
      console.log(result);

      //res.json과 res.render의 차이
      // json -프론트가 알아서 처리해서 가져다 만들어야됨.
      // render -페이지 백엔드가 만들어서 보내주기
      //req.json(result)
      res.render("list", { list: result, title: "test용입니다" });
      //render쓰려면 ejs / static있어야함
    });
});
app.listen(8099, () => {
  console.log("8099에서 서버대기중");
});
///페이지 제공 = app.get
// path 안에 join이 기본적으로있음
