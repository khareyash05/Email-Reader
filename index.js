const express = require("express")
const app = express()
const Imap = require('imap');
const {simpleParser} = require('mailparser');
const html2md=require('html-to-md')
const { Base64Decode } = require('base64-stream')
const base64 = require('base-64');
const dotenv = require("dotenv")
dotenv.config({ path: "config.env" })

app.set('view engine', 'ejs')
app.use(express.static('public'))

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const imapConfig = {
  user: process.env.USER,
  password: process.env.PASS,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

var html , text1 , markdown,content1;

const getEmails = () => {
  try {
    const imap = new Imap(imapConfig);
    imap.once('ready', () => {
      imap.openBox('INBOX', false, () => {
        imap.search(['UNSEEN', ['ON', new Date()]], (err, results) => {
          const f = imap.fetch(results, {bodies: ''});
          f.on('message', msg => {
            msg.on('body', stream => {
              simpleParser(stream, async (err, parsed) => {
                const {from, subject, textAsHtml, text} = parsed;
                console.log(parsed);
                /* Make API call to save the data
                   Save the retrieved data into a database.
                   E.t.c
                */
               console.log("Text is here"+text);
               console.log("HTML is here"+textAsHtml);
               text1 = text;
                html = textAsHtml;
              //  markdown = converter.convert(html);
               markdown = html2md(html);
               console.log("Markdown is here"+markdown);
               console.log(parsed.attachments);
               content1 = parsed.attachments[0].content;
               console.log(content1);
              //  console.log(base64.encode(parsed.attachments[0].content));
              //  console.log("Attachments " +parsed.attachments[0].content); // for attachments
              });
            });
          });
          f.once('error', ex => {
            return Promise.reject(ex);
          });
          f.once('end', () => {
            console.log('Done fetching all messages!');
            imap.end();
          });
        });
      });
    });

    imap.once('error', err => {
      console.log(err);
    });

    imap.once('end', () => {
      console.log('Connection ended');
    });

    imap.connect();
  } catch (ex) {
    console.log('an error occurred');
  }
};

getEmails();

app.get("/",(req,res)=>{
  res.render("index",{text1,html,markdown,content1});
})

app.listen(3000, () => {
  console.log("Server started at port 3000");
});