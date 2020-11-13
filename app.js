const Discord = require("discord.js");
const Canvas = require("canvas");

const client = new Discord.Client();
const { Users, Kingdom, Stats, CurrencyShop } = require("./dbObjects");
const { Op } = require("sequelize");
const currency = new Discord .Collection();
const PREFIX = "!";

const talkedRecently = new Set();

Reflect.defineProperty(currency, "add", {
  value: async function add(id, amount) {
    const user = currency.get(id);
    if (user) {
      user.balance += Number(amount);
      return user.save();
    }
    const newUser = await Users.create({ user_id: id, balance: amount });
    currency.set(id, newUser);
    return newUser;
  }
});

Reflect.defineProperty(currency, "getBalance", {
  value: function getBalance(id) {
    const user = currency.get(id);
    return user ? user.balance : 0;
  }
});

client.once("ready", async () => {
  const storedBalances = await Users.findAll();
  storedBalances.forEach(b => currency.set(b.user_id, b));
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async message => {
  if (message.author.bot) return;
  const target = message.author;
  currency.add(message.author.id, 1);
  const loot = await Kingdom.findOne({
    where: { user_id: target.id, item_id: 3 }
  });
  if (loot) {
    currency.add(message.author.id, loot.Level);
  }
  if (!message.content.startsWith(PREFIX)) return;
  const input = message.content.slice(PREFIX.length).trim();
  if (!input.length) return;
  const [, command, commandArgs] = input.match(/(\w+)\s*([\s\S]*)/);
  if (message.channel.type === "dm") {
    if (command === "cards") {
      const Card = await Kingdom.findOne({
        where: { user_id: target.id, item_id: 3 }
      });
      const level = Card.lvl;
      const canvas = Canvas.createCanvas(712, 1000);
      const ctx = canvas.getContext("2d");
      const background = await Canvas.loadImage(
        "https://github.com/CraftyDuck100/JermBot/blob/master/Cards/Bases/" + level + "Base.png?raw=true"
      );
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
      const image = await Canvas.loadImage(
        "https://github.com/CraftyDuck100/JermBot/blob/master/Cards/Images/Mereeo.png?raw=true"
      );
      ctx.drawImage(image, 27, 27, 658, 448);
      const attachment = new Discord.Attachment(canvas.toBuffer(), "cards.png");
      message.channel.send(attachment);
    }
  } else {
    if (command === "loot") {
      const target = message.mentions.users.first() || message.author;
      return message.channel.send(
        `${target.tag} has ${currency.getBalance(
          target.id
        )}<:Loot:717891324086583328>`
      );
    } else if (command === "inventory") {
      const target = message.mentions.users.first() || message.author;
      const user = await Users.findOne({ where: { user_id: target.id } });
      const items = await user.getItems();

      if (!items.length)
        return message.channel.send(`${target.tag} has nothing!`);
      return message.channel.send(
        `${target.tag} currently has ${items
          .map(i => `${i.amount} ${i.item.name}`)
          .join(", ")} ${items}`
      );
    } else if (command === "give") {
      const currentAmount = currency.getBalance(message.author.id);
      const transferAmount = commandArgs
        .split(/ +/g)
        .find(arg => !/<@!?\d+>/g.test(arg));
      const transferTarget = message.mentions.users.first();

      if (!transferAmount || isNaN(transferAmount))
        return message.channel.send(
          `Sorry ${message.author}, that's an invalid amount.`
        );
      if (transferAmount > currentAmount)
        return message.channel.send(
          `Sorry ${message.author}, you only have ${currentAmount}.`
        );
      if (transferAmount <= 0)
        return message.channel.send(
          `Please enter an amount greater than zero, ${message.author}.`
        );

      currency.add(message.author.id, -transferAmount);
      currency.add(transferTarget.id, transferAmount);

      return message.channel.send(
        `Successfully transferred ${transferAmount}💰 to ${
          transferTarget.tag
        }. Your current balance is ${currency.getBalance(message.author.id)}💰`
      );
    } else if (command === "buy") {
      const item = await CurrencyShop.findOne({
        where: { name: { [Op.like]: commandArgs } }
      });
      if (!item) return message.channel.send(`That item doesn't exist.`);
      if (item.cost > currency.getBalance(message.author.id)) {
        return message.channel.send(
          `You currently have ${currency.getBalance(
            message.author.id
          )}, but the ${item.name} costs ${item.cost}!`
        );
      }

      const user = await Users.findOne({
        where: { user_id: message.author.id }
      });
      currency.add(message.author.id, -item.cost);
      await user.addItem(item);
      message.channel.send(`You've bought: ${item.name}.`);
    } else if (command === "shop") {
      const items = await CurrencyShop.findAll();
      return message.channel.send(
        items.map(item => `${item.name}: ${item.cost} Loot`).join("\n"),
        { code: true }
      );
    } else if (command === "leaderboard") {
      return message.channel.send(
        currency
          .sort((a, b) => b.balance - a.balance)
          .filter(user => client.users.has(user.user_id))
          .first(10)
          .map(
            (user, position) =>
              `(${position + 1}) ${client.users.get(user.user_id).tag}: ${
                user.balance
              } Loot`
          )
          .join("\n"),
        { code: true }
      );
    } else if (command === "minute") {
      if (
        talkedRecently.has(message.author.id) &&
        message.author.id !== "JermBot"
      ) {
        message.channel.send(
          "You can only claim your minute bonus every minute lol - " +
            message.author
        );
      } else {
        message.channel.send(
          "You have claimed your minute bonus " +
            message.author +
            "! +3" +
            `<:Loot:717891324086583328>`
        );
        currency.add(message.author.id, 3);
        talkedRecently.add(message.author.id);
        setTimeout(() => {
          talkedRecently.delete(message.author.id);
        }, 60000);
      }
    } else if (command === "help") {
      message.channel.send(
        "**!loot**: Tells you how much Loot you have" +
          "\n" +
          "**!leaderboard**: Tells you the top 10 richest goons" +
          "\n" +
          "**!shop**: Displays the shop" +
          "\n" +
          "**!buy *item***: Purchases ***item*** from the shop" +
          "\n" +
          "**!minute**: Claim your minutely bonus" +
          "\n" +
          "**!inventory**: Displays your inventory" +
          "\n" +
          "**!give *@user amount***: Gives ***person*** ***amount*** Loot" +
          "\n" +
          "**!kingdom**: Displays your kingdom" +
          "\n" +
          "**!move *item* *x* *y***: Moves your ***item*** to ***x***, ***y*** of your kingdom if you have that ***item***. Your ***item***'s top-left corner will be the be in the ***x*** ***y*** sqaure of your Kingdom"
      );
    } else if (command === "kingdom") {
      const target = message.mentions.users.first() || message.author;
      const user = await Users.findOne({ where: { user_id: target.id } });
      const items = await user.getKingdom();
      const canvas = Canvas.createCanvas(1000, 1000);
      const ctx = canvas.getContext("2d");
      const background = await Canvas.loadImage(
        "https://docs.google.com/drawings/d/e/2PACX-1vSZB69OmYJ5Z9vpLtVvzptutJ7k6EVR1ZTVtc3Md-xVtLdEjTQ96QgswVEUypqvRQhCITDMCg427erP/pub?w=1000&h=1000"
      );
      // This uses the canvas dimensions to stretch the image onto the entire canvas
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
      const Castle = await Kingdom.findOne({
        where: { user_id: target.id, item_id: 1 }
      });
      if (Castle) {
        const x = Castle.X;
        const y = Castle.Y;
        const lvl = Castle.Level;
        const castle = await Canvas.loadImage(
          "https://github.com/CraftyDuck100/JermBot/blob/master/Castle" +
            lvl +
            ".png?raw=true"
        );
        ctx.drawImage(castle, x * 100, y * 100, 200, 200);
      }
      const Tower = await Kingdom.findOne({
        where: { user_id: target.id, item_id: 2 }
      });
      if (Tower) {
        const x = Tower.X;
        const y = Tower.Y;
        const lvl = Tower.Level;
        const tower = await Canvas.loadImage(
          "https://github.com/CraftyDuck100/JermBot/blob/master/Tower" +
            lvl +
            ".png?raw=true"
        );
        ctx.drawImage(tower, x * 100, y * 100, 100, 200);
      }
      const LootFactory = await Kingdom.findOne({
        where: { user_id: target.id, item_id: 3 }
      });
      if (LootFactory) {
        const x = LootFactory.X;
        const y = LootFactory.Y;
        const lvl = LootFactory.Level;
        const lootFactory = await Canvas.loadImage(
          "https://github.com/CraftyDuck100/JermBot/blob/master/LootFactory" +
            lvl +
            ".png?raw=true"
        );
        ctx.drawImage(lootFactory, x * 100, y * 100, 200, 200);
      }
      const attachment = new Discord.Attachment(
        canvas.toBuffer(),
        "this-is-our-kingdom-come.png"
      );
      message.channel.send(attachment);
    } else if (command === "move") {
      const args = message.content.slice(5).split(" ");
      const item = await CurrencyShop.findOne({
        where: { name: args[1] }
      });
      if (item) {
        const X = args[2];
        const Y = args[3];
        const target = message.mentions.users.first() || message.author;
        const user = await Kingdom.findOne({ where: { user_id: target.id } });
        await user.setCCoords(item, X, Y);
        message.channel.send(
          "Sucsessfuly moved " +
            args[1] +
            " to x=" +
            args[2] +
            " y=" +
            args[3] +
            "!"
        );
      } else {
        message.channel.send("Sorry, you don't own a " + args[1]);
      }
    } else if (command === "givemoney") {
      const args = message.content.slice(10).split(" ");
      const transferAmount = args[2];
      const transferTarget = message.mentions.users.first();
      currency.add(transferTarget.id, transferAmount);
    } else if (command === "stats") {
      const target = message.mentions.users.first() || message.author;
      const user = await Users.findOne({ where: { user_id: target.id } });
      const list = await user.getStats();
      const stats = await Stats.findOne({ where: { user_id: target.id } });
      const canvas = Canvas.createCanvas(1000, 300);
      const ctx = canvas.getContext("2d");
      var text = ctx.measureText(target)
      const background = await Canvas.loadImage("https://github.com/CraftyDuck100/JermBot/blob/master/Backrounds/Backround" +
            stats.Backround +
            ".png?raw=true");
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
      const attachment = new Discord.Attachment(
        canvas.toBuffer(),
        "this-is-our-kingdom-come.png"
      );
      message.channel.send(attachment);
    }
  }
});

client.login(process.env.BOT_TOKEN);

