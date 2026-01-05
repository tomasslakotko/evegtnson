# Booking Widget - Инструкция по встраиванию

## Способ 1: Автоматическое встраивание (рекомендуется)

Добавьте на вашу страницу:

```html
<!-- Подключите скрипт -->
<script src="https://yourdomain.com/booking-widget.js"></script>

<!-- Добавьте контейнер для виджета -->
<div 
  id="booking-widget" 
  data-booking-widget 
  data-identifier="username-or-org-slug" 
  data-slug="event-type-slug"
></div>
```

**Пример:**
```html
<script src="https://bookthecall.com/booking-widget.js"></script>
<div 
  id="booking-widget" 
  data-booking-widget 
  data-identifier="acme-inc" 
  data-slug="consultation"
></div>
```

## Способ 2: Ручная инициализация

```html
<script src="https://yourdomain.com/booking-widget.js"></script>
<div id="my-booking-widget"></div>
<script>
  BookingWidget.init('username-or-org-slug', 'event-type-slug', 'my-booking-widget');
</script>
```

## Способ 3: Прямой iframe

```html
<iframe 
  src="https://yourdomain.com/widget/username-or-org-slug/event-type-slug"
  width="100%" 
  height="600" 
  frameborder="0"
  style="border-radius: 8px;"
></iframe>
```

## Настройка стилей

Виджет автоматически адаптируется под размер контейнера. Вы можете настроить размеры:

```css
#booking-widget {
  max-width: 800px;
  margin: 0 auto;
}
```

## Параметры

- `data-identifier` или первый параметр `BookingWidget.init()` - username пользователя или slug организации
- `data-slug` или второй параметр `BookingWidget.init()` - slug типа события
- `id` контейнера - уникальный ID элемента (опционально, будет создан автоматически)

## Примеры использования

### Для индивидуального пользователя:
```html
<div 
  data-booking-widget 
  data-identifier="john-doe" 
  data-slug="consultation"
></div>
```

### Для организации:
```html
<div 
  data-booking-widget 
  data-identifier="acme-corp" 
  data-slug="team-meeting"
></div>
```

## Примечания

- Виджет работает через iframe для изоляции стилей
- Автоматически адаптируется под размер контейнера
- Поддерживает все функции формы бронирования (выбор времени, часовой пояс, и т.д.)
- Работает на любом сайте без конфликтов со стилями

