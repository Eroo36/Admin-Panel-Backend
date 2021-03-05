import { createTransport } from "nodemailer";
import sesTransport from "nodemailer-ses-transport";

// aws.config.loadFromPath("config.json");

export default ({ email, newPassword }) =>
  new Promise(async (resolve, reject) => {
    // const emailTransfer = createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.SENDER_MAIL,
    //     pass: process.env.SENDER_MAIL_PW,
    //   },
    // });

    function callback(error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Message sent!");
      }
    }
    const emailInfo = {
      from: process.env.SENDER_MAIL,
      to: email,
      subject: "Forgotten Password!",
      text: `Here is your new password: ${newPassword}`,
    };

    emailInfo.subject = "Nodemailer SES transporter";
    var sesTransporter = createTransport(
      sesTransport({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
      })
    );

    //sesTransporter.sendMail(emailInfo, callback);

    try {
      await sesTransporter.sendMail(emailInfo, callback);
      //await emailTransfer.sendMail(emailInfo);
      return resolve("sccs");
    } catch (err) {
      return reject(err);
    }
  });
