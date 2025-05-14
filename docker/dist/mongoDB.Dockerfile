FROM --platform=$BUILDPLATFORM mongo
EXPOSE 27017
CMD ["mongod"]
