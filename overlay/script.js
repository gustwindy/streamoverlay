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

const container = document.getElementById("adhd")

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

    container.append(el)

    users[key] = {
        body: shape,
        element: el
    }
}
function addBoringCircle() {
    const shape = Matter.Bodies.circle(0,50,25,{
        restitution: 0.2,
        mass: 1,
        friction: 0.01,
    })
    Matter.Composite.add(engine.world, shape)

    const el = document.createElement("span")

    el.classList.add("adhdCircle")

    container.append(el)

    boringStraightCircles.push({
        body: shape,
        element: el
    })
}

function interact(key) {
    const angleOfLaunch = Math.random()*Math.PI

    Matter.Body.setVelocity(users[key].body,{
        x: Math.cos(angleOfLaunch)*10, // i dont remember if x was cosine or sine
        y: -Math.abs(Math.sin(angleOfLaunch)*25) // but it doesnt matter
    })
    Matter.Body.setAngularSpeed(users[key].body,Math.sign(Math.random())*0.2)
}

for (let i = 0; i < 2; i++) {
    addUser(`a${i}`,"https://cdn.discordapp.com/avatars/1156974559468204132/1791260a416c50f51309e49bac2d6fbf.png?size=4096")
    addUser(`b${i}`,"https://cdn.discordapp.com/avatars/656132997422252042/b6b0a2cc6ec2e378b0a032d470645312.png?size=4096")
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
}

function update() {
    
    Object.values(users).forEach(consume)
    Object.values(boringStraightCircles).forEach(consume)
    requestAnimationFrame(update)
}

requestAnimationFrame(update)