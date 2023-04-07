import { Markup, Telegraf, Scenes, session } from "telegraf";
import { config } from "dotenv";

import { MESSAGES } from "./messages.js";
import {
  isDocument,
  isCorrectTypeImage,
  validateNumber,
  getArrayBufferImage,
  blurImage,
  flipImage,
  flopImage,
} from ".//helpers.js";

function getLinkOfFile(ctx) {
  return ctx.telegram
    .getFileLink(ctx.message.document.file_id)
    .then((data) => data.href);
}

async function sendFinalImage(ctx, img) {
  await ctx.replyWithDocument({
    source: img,
    filename: "output" + `.${ctx.session.type.split("/")[1]}`,
  });
  await ctx.reply(MESSAGES.final);
  ctx.session = {};
  return ctx.scene.leave();
}

function errorHandler(ctx, err) {
  console.log(err);
  return ctx.reply(MESSAGES.error);
}

async function saveFileUrl(ctx) {
  if (!isDocument(ctx.message.document)) {
    ctx.replyWithHTML(
      MESSAGES.error,
      Markup.inlineKeyboard([Markup.button.callback("Cancel", "funcCancel")])
    );
    return "error";
  }

  if (!isCorrectTypeImage(ctx.message.document.mime_type)) {
    ctx.replyWithHTML(
      MESSAGES.noCorrectType,
      Markup.inlineKeyboard([Markup.button.callback("Cancel", "funcCancel")])
    );
    return "error";
  }

  ctx.session.type = ctx.message.document.mime_type;
  ctx.session.link = await getLinkOfFile(ctx);
}

function initAnswer(ctx) {
  ctx.replyWithHTML(
    MESSAGES.file,
    Markup.inlineKeyboard([Markup.button.callback("Cancel", "funcCancel")])
  );
  return ctx.wizard.next();
}

function actionReset(ctx) {
  ctx.wizard.selectStep(0);
  return ctx.wizard.steps[ctx.wizard.cursor](ctx);
}

function actionCancel(ctx) {
  ctx.scene.leave();
  return ctx.reply(MESSAGES.cancel);
}

const blurScene = new Scenes.WizardScene(
  "blur-scene",
  async (ctx) => await initAnswer(ctx),
  async (ctx) => {
    if ((await saveFileUrl(ctx)) == "error") return;

    await ctx.replyWithHTML(
      MESSAGES.correctNumber,
      Markup.inlineKeyboard([
        Markup.button.callback("Reset", "funcReset"),
        Markup.button.callback("Cancel", "funcCancel"),
      ])
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    try {
      if (!validateNumber(ctx.message.text)) {
        ctx.replyWithHTML(
          MESSAGES.noCorrectNumber,
          Markup.inlineKeyboard([
            Markup.button.callback("Reset", "funcReset"),
            Markup.button.callback("Cancel", "funcCancel"),
          ])
        );
        return;
      }
      let arrImgBuff = await getArrayBufferImage(ctx.session.link);
      let imgBuff = await blurImage(ctx.message.text, arrImgBuff);
      await sendFinalImage(ctx, imgBuff);
    } catch (err) {
      errorHandler(ctx, err);
    }
  }
);

const flipScene = new Scenes.WizardScene(
  "flip-scene",
  async (ctx) => await initAnswer(ctx),
  async (ctx) => {
    try {
      if ((await saveFileUrl(ctx)) == "error") return;

      let arrImgBuff = await getArrayBufferImage(ctx.session.link);
      let imgBuff = await flipImage(arrImgBuff);
      await sendFinalImage(ctx, imgBuff);
    } catch (err) {
      errorHandler(ctx, err);
    }
  }
);

const flopScene = new Scenes.WizardScene(
  "flop-scene",
  async (ctx) => await initAnswer(ctx),
  async (ctx) => {
    try {
      if ((await saveFileUrl(ctx)) == "error") return;

      let arrImgBuff = await getArrayBufferImage(ctx.session.link);
      let imgBuff = await flopImage(arrImgBuff);
      await sendFinalImage(ctx, imgBuff);
    } catch (err) {
      errorHandler(ctx, err);
    }
  }
);

// dotenv config on
config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Scenes.Stage([blurScene, flipScene, flopScene]);
bot.use(session());
bot.use(stage.middleware());

// bot.start((ctx) => ctx.reply(MESSAGES.start));
bot.help((ctx) => ctx.replyWithHTML(MESSAGES.help));
bot.command("setblur", (ctx) => ctx.scene.enter("blur-scene"));
bot.command("flipvertical", (ctx) => ctx.scene.enter("flip-scene"));
bot.command("fliphorizontal", (ctx) => ctx.scene.enter("flop-scene"));

bot.on("message", (ctx) => ctx.replyWithHTML(MESSAGES.help));

blurScene.action("funcReset", (ctx) => actionReset(ctx));
blurScene.action("funcCancel", (ctx) => actionCancel(ctx));
flipScene.action("funcCancel", (ctx) => actionCancel(ctx));
flopScene.action("funcCancel", (ctx) => actionCancel(ctx));

bot.launch();

// enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// bot.on(message("text"), (ctx) => {
//   setTimeout(() => {
//     ctx.reply(ctx.message.text);
//   }, Number(ctx.message.text));
// });
