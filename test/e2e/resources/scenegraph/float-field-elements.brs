' rect2d / vector2d / floatarray elements are Float on a device, even for integer-valued input.
sub main()
    node = createObject("roSGNode", "Node")

    node.addField("r", "rect2d", false)
    node.r = { x: 1, y: 2, width: 3, height: 4 }
    print type(node.r.x); " "; type(node.r.width)

    node.addField("fa", "floatarray", false)
    node.fa = [1, 2]
    print type(node.fa[0]); " "; type(node.fa[1])

    node.addField("v", "vector2d", false)
    node.v = [1, 2]
    print type(node.v[0]); " "; type(node.v[1])

    group = createObject("roSGNode", "Group")
    group.translation = [80, 0]
    print type(group.translation[0]); " "; type(group.translation[1])

    ' values are unchanged, only the type
    print node.r.x + node.r.height
end sub
