async function test(){
    return new Promise((resolve, reject) => {
        setTimeout(function(){console.log("done"); resolve(true)}, 5000)
    })
}
async function A(){
    await test()
    console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
    
}
function B(){
    console.log("BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB")
}

A()
B()