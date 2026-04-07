const fs = require("fs");
const path = require("path");

const directoryPath = __dirname;
const files = fs
  .readdirSync(directoryPath)
  .filter((f) => f.endsWith("Modal.js"));

const dictionary = {
  "Personal Information": "Personal Information / Impormasyong Personal",
  "Select your profile from the directory":
    "Select your profile from the directory / Pumili ng profile sa direktoryo",
  ">Resident Full Name<": ">Resident Full Name / Buong Pangalan ng Residente<",
  ">Age<": ">Age / Edad<",
  ">Sex<": ">Sex / Kasarian<",
  ">Civil Status<": ">Civil Status / Katayuang Sibil<",
  ">Residential Address<": ">Residential Address / Tirahan<",
  "Notification & Contact": "Notification & Contact / Notipikasyon at Contact",
  ">Email Address (Optional)<": ">Email Address (Optional) / Email (Opsyonal)<",
  ">Contact Number ": ">Contact Number / Numero ng Telepono ",
  ">Request Purpose<": ">Request Purpose / Layunin ng Request<",
  "Purpose of Clearance <":
    "Purpose of Clearance / Dahilan ng Pagkuha ng Clearance <",
  "Submit Application": "Submit Application / Ipadala ang Aplikasyon",
};

files.forEach((file) => {
  const filePath = path.join(directoryPath, file);
  let content = fs.readFileSync(filePath, "utf-8");

  for (const [eng, translated] of Object.entries(dictionary)) {
    content = content.split(eng).join(translated);
  }

  fs.writeFileSync(filePath, content, "utf-8");
  console.log("Updated", file);
});
