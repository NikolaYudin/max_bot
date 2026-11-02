FROM node:18-alpine

RUN apk add --no-cache ca-certificates openssl

# Копируем сертификаты Минцифры (если они есть в папке certs/)
COPY certs/ /tmp/certs/

RUN mkdir -p /usr/local/share/ca-certificates/mintsifry && \
    for f in /tmp/certs/*.cer; do \
        name=$(basename "$f" .cer); \
        openssl x509 -inform DER -in "$f" -out "/usr/local/share/ca-certificates/mintsifry/${name}.crt" 2>/dev/null || \
        cp "$f" "/usr/local/share/ca-certificates/mintsifry/${name}.crt"; \
    done && \
    update-ca-certificates && \
    rm -f /etc/ssl/certs/mintsifry-bundle.pem && \
    for crt in /usr/local/share/ca-certificates/mintsifry/*.crt; do \
        cat "$crt" >> /etc/ssl/certs/mintsifry-bundle.pem; \
        echo "" >> /etc/ssl/certs/mintsifry-bundle.pem; \
    done && \
    echo "✅ Сертификаты установлены"

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/mintsifry-bundle.pem

CMD ["node", "index.js"]
