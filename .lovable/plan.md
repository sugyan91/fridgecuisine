Remove dislikes from community recipes across the app:

- Database: delete all downvote records (111 removed)
- Frontend: remove downvote button from recipe page, remove down_count from cards/listing/strip
- Server: restrict vote to "up"/null only, remove down_count from API responses