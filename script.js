
const input = document.getElementById("inputData");
const output = document.getElementById("outputData");
const statusText = document.getElementById("status");
const totalText = document.getElementById("total");

let transactions = [];

const bankNames = [
  "SHOPEEPAY",
  "SHOPEE PAY",
  "LINKAJA",
  "LINK AJA",
  "GOPAY",
  "GO PAY",
  "DANA",
  "OVO",
  "BCA DIGITAL",
  "BCA",
  "BRI",
  "BNI",
  "MANDIRI",
  "BSI",
  "CIMB",
  "JAGO",
  "SEABANK",
  "PERMATA",
  "DANAMON"
];

function clean(value) {
  return value
    .replace(/&#x20;/gi, "")
    .replace(/&nbsp;/gi, "")
    .replace(/&#160;/gi, "")
    .replace(/\\/g, "")
    .replace(/\u200B/g, "")
    .trim();
}

function isAmount(value) {
  return /^[\d.,]+$/.test(value) &&
    value.replace(/\D/g, "").length >= 3;
}

function isAccount(value) {
  const digits = value.replace(/\D/g, "");
  return /^\d{6,25}$/.test(digits);
}

function addRecord(username, bank, owner, account, amount) {
  if (!username || !bank || !owner ||
      !account || !amount) return;

  transactions.push({
    username,
    owner,
    bank,
    account,
    amount
  });
}

function processData() {
  const lines = input.value
    .split(/\r?\n/)
    .map(clean)
    .filter(Boolean);

  transactions = [];

  for (let i = 0; i < lines.length; i++) {

    const line = lines[i];

    // FORMAT 1: TABEL MARKDOWN

    if (line.includes("|")) {
      const cells = line.split("|").map(clean);

      if (cells.length < 6) continue;

      const [username, owner, bank, account, amount] =
        cells.slice(1, 6);

      if (
        !username || !owner || !bank ||
        !account || !amount ||
        /user id|username/i.test(username) ||
        /^[-:\s]+$/.test(cells.join(""))
      ) continue;

      addRecord(username, bank, owner, account, amount);
      continue;
    }

    // FORMAT 2: TIGA BARIS
    // username
    // DANA,NAMA,NO REKENING
    // NOMINAL

    if (i + 2 < lines.length) {
      const parts = lines[i + 1].split(",").map(clean);
      const amount = clean(lines[i + 2]);

      if (
        parts.length === 3 &&
        isAccount(parts[2]) &&
        isAmount(amount)
      ) {
        addRecord(
          line,
          parts[0],
          parts[1],
          parts[2],
          amount
        );

        i += 2;
        continue;
      }
    }

    // FORMAT 3:
    // username NAMA BANK
    // NO REKENING
    // NOMINAL

    if (i + 2 < lines.length) {
      const account = clean(lines[i + 1]);
      const amount = clean(lines[i + 2]);

      if (isAccount(account) && isAmount(amount)) {

        const match = line.match(/^(\S+)\s+(.+)$/);

        if (match) {
          const username = match[1];
          const remaining = match[2];

          const bank = bankNames.find(name =>
            remaining.toUpperCase().endsWith(name)
          );

          if (bank) {
            const owner = remaining
              .slice(0, -bank.length)
              .trim();

            if (owner) {
              addRecord(
                username,
                bank,
                owner,
                account,
                amount
              );

              i += 2;
              continue;
            }
          }
        }
      }
    }
  }

  // Buat hasil tiga baris
  output.value = transactions.map(item =>
    `${item.username}\n${item.bank},${item.owner},${item.account}\n${item.amount}`
  ).join("\n\n");

  statusText.textContent =
    `♡ Berhasil membaca ${transactions.length} transaksi!`;

  totalText.textContent =
    `♡ Total Data: ${transactions.length} Transaksi`;
}

// Otomatis saat mengetik atau paste
input.addEventListener("input", processData);

// Tombol proses
document.getElementById("processBtn")
  .addEventListener("click", processData);

// Reset
document.getElementById("resetBtn")
  .addEventListener("click", () => {
    input.value = "";
    output.value = "";
    transactions = [];

    statusText.textContent = "♡ Siap membaca transaksi!";
    totalText.textContent = "♡ Total Data: 0 Transaksi";
  });

// Copy hasil
document.getElementById("copyAll")
  .addEventListener("click", async () => {

    if (!output.value) {
      statusText.textContent = "♡ Belum ada hasil!";
      return;
    }

    try {
      await navigator.clipboard.writeText(output.value);
      statusText.textContent = "♡ Berhasil menyalin hasil!";
    } catch {
      output.select();
      const copied = document.execCommand("copy");

      statusText.textContent = copied
        ? "♡ Berhasil menyalin hasil!"
        : "♡ Gagal menyalin hasil!";
    }
  });
