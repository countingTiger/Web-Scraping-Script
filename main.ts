import puppeteer, { Browser, Page } from "puppeteer";
import fs from "node:fs/promises";
import path from "path";
import axios from "axios";
// 引入dotenv库
import dotenv from "dotenv";

dotenv.config();

// 在其他模块加载之前，你可以使用process.env来访问.env文件中的变量
const myVariableUrl = process.env.MY_VARIABLE_URL;

let count = 0;

async function test() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();
    const targetFilePath = path.resolve("./file/img.json");
    const targetImgFilePath = "./img/";

    await fs.appendFile(targetFilePath, "");

    page.on("load", async () => {
      let h1 = await page.$eval("#imgList", (node) => node.outerHTML);
      // console.log(h1)
      h1 = h1.replace("s", "");
      let sub = h1.split('id="imgList">')[1];
      sub = sub.split("</p>")[0];
      const sArr = sub.split("<br>");
      const reg = /https:[^-%]+\.(jpg|webp)/;

      for (let i = 0; i < sArr.length; i++) {
        const s = sArr[i];
        const ss = s.match(reg)?.[0];

        if (ss) {
          if (count !== 0) {
            await fs.appendFile(targetFilePath, ",");
          } else {
            await fs.appendFile(targetFilePath, "[");
          }

          console.log("url:", ss);

          const newData = {
            url: ss,
            i: count++,
          };

          await fs.appendFile(targetFilePath, JSON.stringify(newData));
        }
      }
      const hasNextPage = await findNextPage(page, browser);
      if (hasNextPage) {
      } else {
        await fs.appendFile(targetFilePath, "]");
        try {
          fetchImg(targetFilePath, targetImgFilePath);
        } catch (error) {
          console.log(error);
        }
      }
    });

    page.on("dialog", async (dialog) => {
      await dialog.dismiss();
    });

    await page.goto(myVariableUrl || "");
  } catch (error) {
    console.log(error);
  }
}

async function findNextPage(page: Page, browser: Browser) {
  // 找到下一页
  const selector = "#div_width > p > a:last-child";

  let h2 = await page?.$eval(selector, (node) => node.outerHTML);

  // console.log(h2);

  if (h2.match("下一話")) {
    const a = await page.$("#div_width > p > a:last-child");
    a?.click();
    return true;
  } else {
    console.log("error match 下一話");
    browser.close();
    return false;
  }
}

async function fetchImg(pathString: string, targetImgFilePath: string) {
  const rawData = await fs.readFile(pathString);
  const strData = rawData.toString("utf8"); // 将 Buffer 转换为字符串
  const jsonData = JSON.parse(strData) as Array<{ i: number; url: string }>;

  for (let index = 0; index < jsonData.length; index++) {
    const { url, i } = jsonData[index];

    // console.log("url", url);

    const option = {
      method: "get",
      url,
      responseEncoding: "binary",
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.9",
        Connection: "keep-alive",
        Host: " 1.static04mh.xyz",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "sec-ch-ua":
          '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "Windows",
      },
      // 设置代理
      proxy: {
        protocol: "http",
        host: "127.0.0.1",
        port: 7982,
      },
    };

    let r: any = {
      status: 100,
    };

    while (r.status !== 200) {
      await sleep(1000);

      try {
        r = await axios(option as any);
      } catch (error) {
        console.log(error);
      }
    }

    try {
      // await fs.writeFile(path.resolve(targetImgFilePath, "-img" + i + ".jpeg") , "");
      // const b = await fs.readFile("./img/l6M6mXLSyBChMdAeiv8Few==.jpg")
      // console.log(r.data);
      // console.log(b);
      // console.log(b.equals(r.data));

      await fs.writeFile(`./img/${i + 1}.jpg`, r.data);
    } catch (error) {
      console.log(error);
    }

    // break;
  }

  // 发起HTTP GET请求以下载图片
}

function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

test();
