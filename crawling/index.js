const express = require("express");
const cors = require("cors");
// const morgan = require("morgan");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const app = express();

app.set("port", process.env.PORT || 8099);

// app.use(morgan("dev"));
app.use(cors());

const PORT = app.get("port");

app.get("/", (req, res) => {
  res.send("hello 토마토");
});

app.get("/daum/news", (req, res) => {
  axios({
    url: "https://news.daum.net/",
  }).then((response) => {
    // console.log(response.data);
    const $ = cheerio.load(response.data);
    const newsList = $(".list_newsissue").children("li");
    const sendNewsList = [];
    newsList.each((idx, item) => {
      sendNewsList.push({
        title: $(item).find(".tit_g").text().replaceAll("\n", "").trim(),
        img: $(item).find(".wrap_thumb .thumb_g").attr("src"),
        category: $(item).find(".txt_category").text(),
        company: $(item).find(".logo_cp .thumb_g").attr("src"),
        url: $(item).find(".tit_g a").attr("href"),
      });
    });
    res.json(sendNewsList);
    // res.send(sendNewsList);
  });
});

app.get("/gmarket/best", async (req, res) => {
  axios({
    url: "http://corners.gmarket.co.kr/SuperDeals",
  }).then((response) => {
    // console.log(response.data);
    const $ = cheerio.load(response.data);
    const bestList = $(".item_list").children("li");
    const gmarketList = [];
    bestList.each((idx, item) => {
      gmarketList.push({
        img: $(item).find(".inner .thumb").attr("src"),
        // img02: $(item).find(".inner a img").attr("src"),
        name: $(item).find(".title").text(),
        oprice: $(item).find(".price del").text(),
        sprice: $(item).find(".price strong").text(),
        sale: $(item).find(".sale strong").text(),
        buy: $(item).find(".option .buy strong").text(),
        url: $(item).find(".inner a").attr("href"),
        tagimg: $(item).find(".tag img").attr("src"),
        t01: $(item).find(".tag").text(),
      });
    });
    res.json(gmarketList);
    //res.send(gmarketList);
  });
});

//동적로딩 ssr(서버 사이트 렌더링) / csr(클라이언트 사이트 렌더링)
//csr을 크롤링하고싶다면 -> puppeteer ( chrome에서만동작 )
//동기적 : 순서에 맞춰서 하나끝내고 하나하기
//비동기적 : 빨래돌리면서 청소하고 밥지으면서 밥먹기 ...

//promise : 비동기적 실행을 동기적으로 처리할 수 있다

//async쓰면 await(promise리턴) 쓸수있음 & 비동기로 동작
app.get("/gmarket/:item", async (req, res) => {
  const item = req.params.item;
  const searchItem = encodeURIComponent(item);

  const browser = await puppeteer.launch({
    headless: true, //true면 메모리상에서만 존재, 실제로뜨지않음 ! 테스트시 false
    args: ["--no--sandbox", "--disable-setuid-sandbox"],
  });
  //헤로쿠에 크롤링배포시 headless랑 args 써야됨!!

  const page = await browser.newPage();

  //lazyload일때방법 (1)
  await page.setViewport({
    width: 1920,
    height: 1000,
  });
  await page.goto(`http://browse.gmarket.co.kr/search?keyword=${searchItem}`, { waitUntil: "load" });
  const content = await page.content();

  const $ = cheerio.load(content);

  const items = $(".box__component-itemcard");
  const sendItemsArray = [];

  items.each((idx, item) => {
    const link = $(item).find(".link__item").attr("href");
    const title = $(item).find(".text__item").text();
    const price = $(item).find(".text__value").text();
    const star = $(item).find(".box__seller-awards .image__awards-points .for-a11y").text();
    const seller = $(item).find(".box__information_seller .link__shop .text__seller").text();
    // const gradeIcon = $(item).find(".box__seller-grade .list__seller-information .list-item img").attr("src");
    const img = $(item).find(".box__item-container img").attr("src");
    const grade = $(item).find(".box__seller-grade .list__seller-information .list-item img").text();
    const count = $(item).find(".list-item__pay-count .text").text();
    sendItemsArray.push({ title: title, price: price, star: star, seller: seller, grade: grade, link: link, count: count, img: img }); //키=밸류이면 생랼가능
    // console.log(img);
  });
  res.json(sendItemsArray);
});

app.get("/navertv/:item", async (req, res) => {
  const item = req.params.item;
  const searchItem = encodeURIComponent(item);
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  //await = 비동기를 동기로 실행
  await page.setViewport({
    width: 1920,
    height: 10000,
  });

  await page.goto(`https://tv.naver.com/search?query=${searchItem}&page=1`);
  await page.evaluate(async () => {
    //console.log(document.body.scrollHeight);
    await new Promise((resolve, reject) => {
      const scrollHeight = document.body.scrollHeight;
      const amount = 500;
      let totalHeight = 0;
      const timerID = setInterval(function () {
        window.scrollBy(0, amount);
        totalHeight += amount;
        if (totalHeight > scrollHeight) {
          clearInterval(timerID);
          resolve();
        }
      }, 50);
    });
  });
  const content = await page.content();

  const $ = cheerio.load(content);

  const items = $(".thl ");
  const sendItemsArray = [];

  items.each((idx, item) => {
    const link = $(item).find(".thl_a").attr("href");
    const img = $(item).find(".thl_a img").attr("src");
    const title = $(item).find(".inner dt a").text();
    const meta = $(item).find(".ch_txt a").text();
    const click = $(item).find(".cnp").text();
    const like = $(item).find(".bch").text();
    const day = $(item).find(".inner dd time").text();

    sendItemsArray.push({ link: link, img: img, title: title, meta: meta, click: click, like: like, day: day });
  });
  res.json(sendItemsArray);
});

app.listen(PORT, () => {
  console.log(`${PORT}에서 대기중`);
});
