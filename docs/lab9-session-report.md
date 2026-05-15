# Лабораторна робота 9. Session-based автентифікація з Redis

## Що я зробив

Я додав у застосунок session-based автентифікацію, де сесії зберігаються в Redis. Існуюча бізнес-логіка inventory та GitHub-ендпоінтів не змінювалася. Я окремо додав auth-маршрути, сервіс автентифікації, схеми валідації і захистив лише ті inventory-ендпоінти, які змінюють дані.

У цій роботі я використав `@fastify/session`, `@fastify/cookie`, `fastify-session-redis-store`, `argon2`, Redis і Swagger.

## Інтеграція сесій через Fastify і Redis

Сесійну автентифікацію я підключив на рівні Fastify. Для цього спочатку реєструється `@fastify/cookie`, а після нього `@fastify/session`. Як storage для сесій використовується Redis store.

Приклад конфігурації:

```js
await instance.register(fastifyCookie);
await instance.register(fastifySession, {
  cookie: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
    sameSite: 'lax',
    secure: false,
  },
  rolling: true,
  saveUninitialized: false,
  secret: instance.config.SESSION_SECRET,
  store: new RedisStore({
    client: instance.redis,
    prefix: 'sess:',
    ttl: 24 * 60 * 60,
  }),
});
```

TTL для сесій становить 24 години. Це стосується і cookie, і ключів у Redis.

## SESSION_SECRET і cookie

Я додав `SESSION_SECRET` у `.env`, `.env.example` і в схему `@fastify/env`. Без цього `@fastify/session` нормально не працює, бо cookie з ідентифікатором сесії має бути підписаний.

Для cookie я залишив базові безпечні налаштування:

1. `httpOnly: true`
2. `sameSite: 'lax'`
3. `path: '/'`
4. `maxAge: 24 години`

`secure: false` я використав для локального HTTP-запуску. Для HTTPS це значення треба було б підняти.

## Dependency Injection

Fastify-екземпляр у сервіси я не імпортував. Як і в попередній лабораторній, залежності передаються через фабрики.

Для auth я зробив окремий репозиторій користувачів і окремий сервіс:

```js
configureAuthService({
  usersRepository: createUsersRepository(instance.db),
});
```

За таким самим підходом уже працює inventory service. Тобто доступ до БД і Redis передається через DI, а не тягнеться напряму через імпорт Fastify.

## Сервіс автентифікації

Я додав `auth.service.js`, у якому виніс логіку реєстрації та входу. Там є дві головні операції:

1. `argon2.hash()` при реєстрації
2. `argon2.verify()` при вході

Фрагмент коду:

```js
const hashedPassword = await argon2.hash(password);

const isPasswordValid = await argon2.verify(user.password, password);
```

Також я зробив санітизацію користувача перед відповіддю. Поле `password` у відповіді не повертається.

```js
function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
  };
}
```

## Логіка реєстрації

Для `POST /auth/register` я реалізував таку послідовність:

1. перевірка тіла запиту через JSON Schema
2. пошук користувача за email
3. якщо email уже існує, повертається помилка
4. пароль хешується через `argon2.hash()`
5. користувач зберігається в БД
6. у відповідь повертається тільки `id` і `email`

Це дає просту і зрозумілу реєстрацію без витоку пароля.

## Логіка входу

Для `POST /auth/login` я зробив перевірку email і пароля. Якщо користувача немає або пароль неправильний, повертається `401`.

Якщо перевірка пройшла, я записую дані користувача в сесію:

```js
request.session.user = user;
```

Після цього клієнт отримує session cookie і може працювати із захищеними ендпоінтами.

## Логіка виходу

Для `POST /auth/logout` я використав знищення сесії:

```js
await request.session.destroy();
```

Успішна відповідь має статус `204 No Content`.

## Валідація через JSON Schema

Для auth-ендпоінтів я додав окремі схеми:

1. `POST /auth/register`
2. `POST /auth/login`
3. `POST /auth/logout`

Для register і login перевіряються:

1. `email`
2. `password`

Приклад body schema:

```js
const authBodySchema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 },
  },
  required: ['email', 'password'],
  additionalProperties: false,
};
```

## Захист ендпоінтів через onRequest

GET-ендпоінти я залишив публічними. Захист додав тільки для маршрутів, які змінюють дані inventory.

У цьому проєкті це:

1. `POST /api/v1/inventory`
2. `POST /api/v1/inventory/import`
3. `POST /api/v1/inventory/:id/image`
4. `PATCH /api/v1/inventory/:id`
5. `DELETE /api/v1/inventory/:id`

Для цього я зробив окремий `requireSession` хук:

```js
async function requireSession(request, reply) {
  if (request.session?.user?.id) {
    return;
  }

  return reply.unauthorized(ERROR_MESSAGES.UNAUTHORIZED);
}
```

Далі я підключив його в route options:

```js
fastify.post(
  '/inventory',
  {
    onRequest: requireSession,
    schema: createInventorySchema,
  },
  inventoryController.addItem
);
```

## Swagger

Auth-ендпоінти я додав у Swagger документацію. У `/docs` тепер є окремий тег `Auth`, де видно:

1. `POST /auth/register`
2. `POST /auth/login`
3. `POST /auth/logout`

Через це сценарій реєстрації, входу і виходу можна перевіряти прямо в браузері.

## Що перевіряв

Я перевірив:

1. встановлення нових пакетів
2. імпорт застосунку без синтаксичних помилок
3. `npm run lint`
4. наявність auth-ендпоінтів у Swagger JSON
5. коректну збірку конфігурації сесій, cookie і Redis store

Під час локальної перевірки в мене ще окремо з’явився шум на рівні XAMPP MySQL: завислі старі запити по `inventory_items` блокували частину ручних API-перевірок. Код auth при цьому вже був доданий, але для чистої повторної перевірки краще запускати після свіжого рестарту MySQL і Redis.

## Що вставити у скріншоти

### Скріншот 1

Показати Swagger з auth-ендпоінтами.

На скріншоті має бути видно:

1. сторінку `/docs`
2. тег `Auth`
3. маршрути `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`

### Скріншот 2

Показати успішну реєстрацію користувача.

На скріншоті має бути видно:

1. `POST /auth/register`
2. тіло запиту з `email` і `password`
3. статус `201`
4. відповідь без поля `password`

### Скріншот 3

Показати успішний логін і створення сесії.

На скріншоті має бути видно:

1. `POST /auth/login`
2. статус `200`
3. відповідь з `id` і `email`
4. cookie або session id у клієнті

### Скріншот 4

Показати ключі сесій у Redis.

На скріншоті має бути видно:

1. Redis key з префіксом `sess:`
2. значення або preview даних сесії
3. TTL близько 24 годин

### Скріншот 5

Показати захист inventory-ендпоінтів без сесії.

На скріншоті має бути видно:

1. запит на `POST`, `PATCH` або `DELETE` inventory без логіну
2. статус `401`
3. повідомлення про `Unauthorized`

### Скріншот 6

Показати успішний виклик захищеного inventory-ендпоінта після логіну.

На скріншоті має бути видно:

1. той самий захищений маршрут
2. успішний статус відповіді
3. що запит уже проходить із сесією

## Підсумок

Я додав session-based автентифікацію з Redis store, окремий auth service на `argon2`, Swagger-документацію для auth і захист мутаційних inventory-ендпоінтів через `onRequest`. Поле `password` у відповідях не повертається, а GET-маршрути, як і вимагалось, залишилися публічними.
