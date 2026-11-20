sub main()
    screen = CreateObject("roSGScreen")
    port = CreateObject("roMessagePort")
    screen.setMessagePort(port)
    scene = screen.CreateScene("ProbeScene")
    screen.show()
    n = CreateObject("roSGNode", "Node")
    n.addField("i", "integer", false) : n.i = 5 : n.i = invalid
    emit("integer_after_invalid", n.i.toStr())
    n.addField("fl", "float", false) : n.fl = 2.5 : n.fl = invalid
    emit("float_after_invalid", n.fl.toStr())
    n.addField("s", "string", false) : n.s = "abc" : n.s = invalid
    emit("string_after_invalid", """" + n.s + """")
    n.addField("b", "boolean", false) : n.b = true : n.b = invalid
    emit("bool_after_invalid", bs(n.b))
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
