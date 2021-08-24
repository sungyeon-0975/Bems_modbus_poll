import socket
from xml.etree.ElementTree import parse

command = '<xml version="1.0" encoding="UTF-8"><header/><body><cmd>MONITOR</cmd><body/>'

client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
client.connect(("192.168.0.XX", 54239))

client.send(command)

resp = client.recv(3000)
print(resp)
root = parse(resp).getroot()
#이후 세부 크롤링 필요


#https://wikidocs.net/21140