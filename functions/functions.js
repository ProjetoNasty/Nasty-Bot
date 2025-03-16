
const Discord = require("discord.js")
const config = require('../config.json')
const client = require("../index");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

function decToHex(dec) {
    return `#${(dec + Math.pow(16, 6)).toString(16).substr(-6)}`
}

function emoji(emoji) {
    try {
        return client.emojis.cache.find(e => e.name.includes(emoji) ? e.name.includes(emoji) && e.available == true : e.id == `${emoji}` && e.available == true)
    } catch (e) {
        return console.log(e.stack);
    }
}

module.exports = {
    decToHex,
    fetch,
    emoji
}