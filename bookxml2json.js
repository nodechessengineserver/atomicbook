"use strict";

function bookXmlJsonToBookJson(bookXmlJson){
    let bookJson={};
    bookXmlJson.book.positionlist[0].position.map(position=>{
        let tfen=position.$.tfen
        let posJson={
            tfen:tfen,
            moves:{}
        };
        position.movelist[0].move.map(move=>{
            let san=move.$.s;
            let es=move.es[0];
            let ms=move.ms[0];
            posJson.moves[san]={
                es:es,
                ms:ms
            };
        });
        bookJson[tfen]=posJson
    });
    return bookJson
}

module.exports.bookXmlJsonToBookJson=bookXmlJsonToBookJson