sub main()
    screen = CreateObject("roSGScreen")
    port = CreateObject("roMessagePort")
    screen.setMessagePort(port)
    scene = screen.CreateScene("ProbeScene")
    screen.show()
    n = CreateObject("roSGNode", "Node")
    n.addField("r", "rect2d", false) : n.r = { x: 1, y: 2, width: 3, height: 4 }
    n.addField("fa", "floatarray", false) : n.fa = [1, 2]
    n.addField("v", "vector2d", false) : n.v = [1, 2]
    emit("elements", "rect2d.x=" + type(n.r.x) + " floatarray[0]=" + type(n.fa[0]) + " vector2d[0]=" + type(n.v[0]))
    g = CreateObject("roSGNode", "Group")
    g.translation = [80, 0]
    emit("translation", "translation[0]=" + type(g.translation[0]))
    print "done"
    screen.close()
end sub

sub emit(id as string, v as string)
    print id + "|" + v
    sleep(15)
end sub

function bs(b as dynamic) as string
    if b = true then return "true"
    return "false"
end function
