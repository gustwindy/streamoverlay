const engine = Matter.Engine.create()
const runner = Matter.Runner.create()

const walls = [
    Matter.Bodies.rectangle(0,-300,1000,100, { isStatic: true }),
    Matter.Bodies.rectangle(0,300,1000,100, { isStatic: true }),
    Matter.Bodies.rectangle(-550,0,100,1000, { isStatic: true }),
    Matter.Bodies.rectangle(550,0,100,1000, { isStatic: true }),
]
const users = {}
const boringStraightCircles = []

Matter.Composite.add(engine.world, walls)

const adhdContainer = document.getElementById("adhd")
const chatContainer = document.getElementById("chat")
const noteArea = document.querySelector(".noteArea")
const note = document.getElementById("note")

function addUser(key, url) {
    const shape = Matter.Bodies.circle(0,0,50,{
        restitution: 0.8,
        mass: 30
    })
    
    Matter.Composite.add(engine.world, shape)

    const el = document.createElement("span")

    el.classList.add("adhdCircle")
    el.classList.add("adhdUser")
    el.style.backgroundImage = `url(${url})`

    adhdContainer.append(el)

    users[key] = {
        body: shape,
        element: el,
        remove: ()=>{
            Matter.Composite.remove(engine.world,users[key].body)
            users[key].element.remove()
            delete users[key]
        }
    }
}
function addBoringCircle(push = true) {
    const shape = Matter.Bodies.circle(0,50,25,{
        restitution: 0.4,
        mass: 1,
        friction: 0.01,
    })
    Matter.Composite.add(engine.world, shape)

    const el = document.createElement("span")

    el.classList.add("adhdCircle")

    adhdContainer.append(el)

    const d = {
        body: shape,
        element: el,
        remove: ()=>{
            Matter.Composite.remove(engine.world, d.body)
            d.element.remove()
            boringStraightCircles[boringStraightCircles.indexOf(d)] = addBoringCircle(false)
        }
    }

    if (push) boringStraightCircles.push(d)
    return d
}

function interact(key) {
    const angleOfLaunch = Math.random()*Math.PI

    Matter.Body.setVelocity(users[key].body,{
        x: Math.cos(angleOfLaunch)*10, // i dont remember if x was cosine or sine
        y: -Math.abs(Math.sin(angleOfLaunch)*25) // but it doesnt matter
    })
    Matter.Body.setAngularSpeed(users[key].body,Math.sign(Math.random())*0.2)
}

for (let i = 0; i < 45; i++) {
    addBoringCircle()
}
Matter.Runner.run(runner,engine)

function consume(u) {
    const final = {
        x: u.body.position.x + 500,
        y: u.body.position.y + 250,
        rot: u.body.angle
    }
    if (u.last) {
        if (Math.abs(u.last.rot-final.rot) > 0.01||Math.abs(u.last.x-final.x) > 0.25||Math.abs(u.last.y-final.y) > 0.25) {
            u.element.style.left = `${final.x}px`
            u.element.style.top = `${final.y}px`
            u.element.style.transform = `translate(-50%, -50%) rotate(${u.body.angle}rad)`
        }
    }
    u.last = final

    if (Math.max(Math.abs(final.x),Math.abs(final.y)) > 3000) {
        u.remove()
    }
}

function update() {
    Object.values(users).forEach(consume)
    Object.values(boringStraightCircles).forEach(consume)
    requestAnimationFrame(update)
}

const handlers = {
    "userList": (names)=>{
        console.log(names)
        const valid = []
        names.forEach(u=>{
            if (!users[u.name]) {
                addUser(u.name,u.url)
            }
            valid.push(u.name)
        })
        console.log(users,valid)
        Object.keys(users).forEach((name)=>{
            if (valid.indexOf(name) == -1) {
                users[name].remove()
            }
        })
    },
    "message": (message)=>{
        if (users[message.author]) interact(message.author)
        const copy = document.querySelector("#templates .msg").cloneNode(true)

        copy.querySelector(".msg-author").innerText = message.author
        copy.querySelector(".msg-status").innerText = message.mod ? "(mod)" : ""
        copy.querySelector(".msg-text").innerText = message.content

        chatContainer.append(copy)

        while (chatContainer.children.length > 25) {
            chatContainer.firstElementChild.remove()
        }
    },
    "note": (noteText)=>{
        noteArea.classList.toggle("invis",!noteText)
        note.innerText = noteText
    }
}

function connect() {
    var ws = new WebSocket('ws://localhost:61310');
    ws.onopen = function() {
        console.log("connected btw")
    };

    ws.onmessage = function(e) {
        const d = JSON.parse(e.data)
        const handler = handlers[d.type]

        if (handler) {
            handler(d.data)
        } else {
            console.warn("no handler",d)
        }
    };

    ws.onclose = function(e) {
        console.log("gone?!")
        setTimeout(function() {
            connect()
        }, 1000)
    }

    ws.onerror = function(err) {
        ws.close()
    }
}

connect()
requestAnimationFrame(update)