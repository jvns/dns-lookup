all:
	mkdir -p netlify/functions
	go build -o netlify/functions/dns
