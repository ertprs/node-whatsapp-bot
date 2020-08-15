/* eslint-disable max-len */
/* eslint-disable no-console */
const { create, decryptMedia } = require('@open-wa/wa-automate');
const { tz } = require('moment-timezone');
const videoUrlLink = require('video-url-link');
const { parsePhoneNumberFromString } = require('libphonenumber-js');
const korona = require('./korona');
const quotes = require('./quotes');
const menu = require('./menu');

const debug = async (text) => {
  console.log(`${tz('Asia/Jakarta').format('LTS')} 🤖 => ${text}`);
};

const messageHandler = async (message, client) => {
  // eslint-disable-next-line object-curly-newline
  const { from, sender, caption, type, quotedMsg, mimetype, body, isMedia, chat, isGroupMsg } = await message;

  const commandArgs = caption || body || '';
  const command = commandArgs.toLowerCase().split(' ')[0];
  const args = commandArgs.split(' ')[1];

  const phoneNumber = parsePhoneNumberFromString(from, 'ID');
  const number = phoneNumber ? phoneNumber.number : '';
  const name = sender.pushname || chat.name || sender.verifiedName || '';

  const stickerCreatedMsg = `(${name} - ${number}) membuat stiker 🚀`;
  const inMsg = `(${name} - ${number}) mengirim pesan ${commandArgs} 📩`;
  const inMsgImgNoCapt = `(${name} - ${number}) mengirim gambar tanpa caption 📩`;
  const waitStickerMsg = '_Tunggu sebentar stiker lagi dibuat ⏳_';
  const thxMsg = '_Iya sama - sama 🤖_';
  const waitVidMsg = '_Video lagi di upload tunggu aja 🎥_';
  const waitDataMsg = '_Tunggu sebentar data lagi di proses ⏳_';
  const wrongMsg = '_Kayaknya ada yang salah, coba nanti lagi 🚴🏻_';
  const noCaptMsg = '_Pakai caption ya jangan gambar doang, ketik #menu 🤖_';
  const unkMsg = '_Yang bener dong coba ketik *#menu*, kalau ngasal nanti aku block lho 🤖_';
  const doneMsg = '_Tugas selesai 👌, buat liat semua menu bot ketik *#menu*, kalau mau share ke temen - temen kalian atau masukin ke grup juga boleh_';

  try {
    switch (command) {
      case '#sticker':
      case '#stiker':
        if (isMedia && type === 'image') {
          debug(inMsg);
          debug(stickerCreatedMsg);
          client.sendText(from, waitStickerMsg);
          const mediaData = await decryptMedia(message);
          const imageBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`;
          client.sendImageAsSticker(from, imageBase64);
          client.sendText(from, doneMsg);
        }
        if (quotedMsg && quotedMsg.type === 'image') {
          debug(inMsg);
          debug(stickerCreatedMsg);
          client.sendText(from, waitStickerMsg);
          const mediaData = await decryptMedia(quotedMsg);
          const imageBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`;
          client.sendImageAsSticker(from, imageBase64);
          client.sendText(from, doneMsg);
        }
        break;
      case '#menu':
        debug(inMsg);
        client.sendText(from, menu);
        break;
      case '#korona':
        debug(inMsg);
        client.sendText(from, waitDataMsg);
        client.sendText(from, await korona());
        client.sendText(from, doneMsg);
        break;
      case '#quotes':
        debug(inMsg);
        client.sendText(from, waitDataMsg);
        client.sendText(from, quotes());
        client.sendText(from, doneMsg);
        break;
      case '#ig':
        debug(inMsg);
        client.sendText(from, waitDataMsg);
        await videoUrlLink.instagram.getInfo(args, async (error, info) => {
          if (error) {
            client.sendText(from, wrongMsg);
            console.log(error.message);
          } else {
            const url = info.list[0].video ? info.list[0].video : info.list[0].image;
            client.sendText(from, waitVidMsg);
            await client.sendFileFromUrl(from, url);
            client.sendText(from, doneMsg);
          }
        });
        break;
      default:
        if (!isGroupMsg) {
          const thanks = ['terimakasi', 'makasi', 'thx', 'thank', 'trim'];
          const isThanks = !!new RegExp(thanks.join('|')).test(commandArgs);
          if (type === 'image' && !caption) {
            debug(inMsgImgNoCapt);
            client.sendText(from, noCaptMsg);
          } else if (isThanks) {
            debug(inMsg);
            client.sendText(from, thxMsg);
          } else {
            debug(inMsg);
            client.sendText(from, unkMsg);
          }
        }
        break;
    }
  } catch (error) {
    client.sendText(from, wrongMsg);
    console.log(error.message);
  }
};

const start = async (client) => {
  debug('The bot has started');
  // force current session
  client.onStateChanged((state) => {
    debug(`state changed - ${state.toLowerCase()} 🚑`);
    if (state === 'CONFLICT') client.forceRefocus();
  });
  // handling message
  client.onMessage(async (message) => {
    messageHandler(message, client);
  });
};

const options = {};
if (process.platform === 'darwin') options.executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (process.platform === 'linux') options.executablePath = '/usr/bin/google-chrome-stable';

create(options)
  .then(async (client) => start(client))
  .catch((error) => console.log(error));
