index = open('unsorted.txt', 'r')
redirects = open('redirects.txt', 'r')

merged = index.readlines() + map(lambda x: x.split(';')[0] + ";" + x.split(';')[1] + ">" + x.split(';')[2],redirects.readlines())
print "sorting"
merged.sort(lambda y, x: cmp((y.split(";")[0]),(x.split(";")[0])))
print "sorted. mapping."
merged = map(lambda x: ";".join(x.split(";")[1:]), merged)
print "writing"

out = open('index.txt','w')
out.writelines(merged)
out.close()
