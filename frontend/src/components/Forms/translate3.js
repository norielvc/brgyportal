const fs = require("fs");
const path = require("path");

const directoryPath = __dirname;
const files = fs.readdirSync(directoryPath).filter(f => f.endsWith("Modal.js"));

const dictionary = {
  ">Search Directory<": ">Search Directory / Hanapin sa Direktoryo<",
  ">Find your profile and sync your details instantly.<": ">Find your profile and sync your details instantly. / Hanapin ang iyong profile at i-sync agad ang mga detalye.<",
  "Previous / Edit": "Previous / Edit | Nakaraan / I-edit",
  "Review your application before syncing": "Review your application before syncing / Suriin ang aplikasyon bago i-sync",
  ">Cellular Number ": ">Cellular Number / Numero ng Cellphone ",
  ">State Your Purpose ": ">State Your Purpose / Sabihin ang Layunin ",
  ">Back to Dashboard<": ">Back to Dashboard / Bumalik sa Dashboard<",
  ">Confirmed Applicant<": ">Confirmed Applicant / Kumpirmadong Aplikante<",
  ">Verified Member<": ">Verified Member / Beripikadong Miyembro<",
  ">Verified Profile System<": ">Verified Profile System / Sistema ng Beripikadong Profile<",
  ">All details have been validated against the official directory.<": ">All details have been validated against the official directory. / Lahat ng detalye ay napatunayan sa opisyal na direktoryo.<",
  "Next Step ": "Next Step / Susunod ",
  "Submit Request": "Submit Request / I-submit ang Request",
  "Confirm Submission": "Confirm Submission / Kumpirmahin ang Pagpasa",
  ">Previous<": ">Previous / Nakaraan<"
};

files.forEach(file => {
  const filePath = path.join(directoryPath, file);
  let content = fs.readFileSync(filePath, "utf-8");
  
  for (const [eng, translated] of Object.entries(dictionary)) {
    content = content.split(eng).join(translated);
  }
  
  fs.writeFileSync(filePath, content, "utf-8");
  console.log("Updated", file);
});
