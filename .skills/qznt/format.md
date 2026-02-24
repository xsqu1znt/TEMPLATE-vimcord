# qznt.format — Number Formatting

```typescript
import qznt from "qznt";
const { format } = qznt;
```

## currency(num, options?)

```typescript
format.currency(1234.5);                            // "$1,234.50" (USD default)
format.currency(1234.5, { currency: "EUR", locale: "de-DE" }); // "1.234,50 €"
format.currency(500, { currency: "JPY" });          // "¥500" (no decimals)
```

## number(num, options?)

```typescript
format.number(1_000_000);                  // "1,000,000"
format.number(1000, { locale: "de-DE" });  // "1.000"
format.number(1234.567, { precision: 2 }); // "1,234.57"
```

## compactNumber(num, locale?)

```typescript
format.compactNumber(1200);           // "1.2K"
format.compactNumber(1_500_000);      // "1.5M"
format.compactNumber(1234, "de-DE");  // "1,2 Tsd."
```

## memory(bytes, decimals?, units?)

```typescript
format.memory(0);            // "0 B"
format.memory(1024);         // "1.0 KB"
format.memory(1_500_000);    // "1.4 MB"
format.memory(bytes, 2);     // 2 decimal places
```

## ordinal(num, locale?)

```typescript
format.ordinal(1);   // "1st"
format.ordinal(2);   // "2nd"
format.ordinal(3);   // "3rd"
format.ordinal(11);  // "11th"
format.ordinal(42);  // "42nd"
```
