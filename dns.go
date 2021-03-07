package main

import (
	"encoding/json"
	"fmt"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/miekg/dns"
	"strings"
)

type Request struct {
	DomainName string `json:"name"`
	Type       string `json:"type"`
	Server     string `json:"server"`
}

type Response struct {
	Name  string `json:"name"`
	Value string `json:"value"`
	Type  string `json:"type"`
	TTL   uint32 `json:"ttl"`
}

type Responses struct {
	Answer     []Response `json:"answer"`
	Authority  []Response `json:"authority"`
	Additional []Response `json:"additional"`
}

func handler(request events.APIGatewayProxyRequest) (*events.APIGatewayProxyResponse, error) {
	if request.HTTPMethod != "POST" {
		origin := request.Headers["origin"]
		if strings.Contains(origin, "localhost") {
			return &events.APIGatewayProxyResponse{
				StatusCode: 200,
				Headers: map[string]string{
					"Access-Control-Allow-Origin":  origin,
					"Access-Control-Allow-Headers": "*",
				},
			}, nil
		} else {
			return &events.APIGatewayProxyResponse{
				StatusCode: 404,
			}, nil
		}
	}
	var req Request
	if req.Server == "" {
		req.Server = "8.8.8.8"
	}
	if err := json.NewDecoder(strings.NewReader(request.Body)).Decode(&req); err != nil {
		return &events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       fmt.Sprintf("Failed to parse payload: %v", err),
		}, nil
	}

	var results *Responses
	var err error
	if results, err = query(req.Type, req.DomainName, req.Server+":53"); err != nil {
		return &events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       fmt.Sprintf("Failed to make DNS request: %v", err),
		}, nil
	}

	output, err := json.Marshal(results)

	return &events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Headers": "*",
		},
		Body:            string(output),
		IsBase64Encoded: false,
	}, nil
}

func message(typ string, name string) *dns.Msg {
	recs := map[string]uint16{
		"a":       dns.TypeA,
		"aaaa":    dns.TypeAAAA,
		"cname":   dns.TypeCNAME,
		"mx":      dns.TypeMX,
		"ns":      dns.TypeNS,
		"ptr":     dns.TypePTR,
		"soa":     dns.TypeSOA,
		"srv":     dns.TypeSRV,
		"txt":     dns.TypeTXT,
		"dnskey":  dns.TypeDNSKEY,
		"ds":      dns.TypeDS,
		"nsec":    dns.TypeNSEC,
		"nsec3":   dns.TypeNSEC3,
		"rrsig":   dns.TypeRRSIG,
		"afsdb":   dns.TypeAFSDB,
		"atma":    dns.TypeATMA,
		"caa":     dns.TypeCAA,
		"cert":    dns.TypeCERT,
		"dhcid":   dns.TypeDHCID,
		"dname":   dns.TypeDNAME,
		"hinfo":   dns.TypeHINFO,
		"isdn":    dns.TypeISDN,
		"loc":     dns.TypeLOC,
		"mb":      dns.TypeMB,
		"mg":      dns.TypeMG,
		"minfo":   dns.TypeMINFO,
		"mr":      dns.TypeMR,
		"naptr":   dns.TypeNAPTR,
		"nsapptr": dns.TypeNSAPPTR,
		"rp":      dns.TypeRP,
		"rt":      dns.TypeRT,
		"tlsa":    dns.TypeTLSA,
		"x25":     dns.TypeX25,
	}
	m := new(dns.Msg)
	m.Id = dns.Id()
	m.RecursionDesired = true
	m.Question = make([]dns.Question, 1)
	m.Question[0] = dns.Question{name, recs[typ], dns.ClassINET}
	return m
}

func parseRRs(rrs []dns.RR) []Response {
	replies := make([]Response, 0)
	for _, a := range rrs {
		h := a.Header()
		parts := strings.Split(a.String(), "\t")
		replies = append(replies, Response{
			Value: parts[len(parts)-1],
			Name:  h.Name,
			TTL:   h.Ttl,
			Type:  dns.Type(h.Rrtype).String(),
		})
	}
	return replies
}

func query(typ string, name string, dnsServer string) (*Responses, error) {
	typ = strings.ToLower(typ)
	message := message(typ, name)
	c := new(dns.Client)
	c.Net = "tcp"
	in, _, err := c.Exchange(message, dnsServer)
	if err != nil {
		return nil, err
	}
	return &Responses{
		Answer:     parseRRs(in.Answer),
		Authority:  parseRRs(in.Ns),
		Additional: parseRRs(in.Extra),
	}, nil
}

func main() {
	// responses, _ := query("a", "jvns.ca.", "8.8.8.8"+":53")
	// fmt.Println(responses)
	// Make the handler available for Remote Procedure Call by AWS Lambda
	lambda.Start(handler)
}
