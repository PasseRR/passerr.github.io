---
title: 枚举的使用
tags: [ java, enum ]
---

在[MyBatis枚举类型绑定](/2022-08-09-mybatis-enum-bind){:target='_blank' rel="noreferrer"}中就涉及到枚举在Mybatis中的扩展，
个人非常喜欢枚举。

枚举（Enum）是一种特殊的数据类型，它表示一组命名的常量。枚举通常用于表示有限集合的值，通常如状态码、等级、方向等。它具有以下特性：

- **有限性**：枚举的值是有限且已知的，这使得枚举类型非常适合表示一组固定的常量。
- **可读性**：使用枚举常常能增强代码的可读性和可维护性，尤其在需要表示某个固定集合的常量时。
- **类型安全**：枚举为值提供了类型安全，避免了直接使用字符串或数字常量时可能出现的错误。
- **可扩展性**：良好的枚举设计应当便于未来的扩展，特别是当系统需要添加新的值时。

### 贫血枚举

贫血枚举是指枚举类仅仅作为值的容器，通常没有附加的行为或逻辑。它只包含静态的常量值和可能的简单属性（如名称、值等），
但没有任何业务逻辑。贫血枚举通常用于简单的情况，比如表示状态、类型或配置项。贫血枚举通常有以下特点：

- 简洁：只有常量值和简单属性（例如整数值、字符串值等，甚至无属性）。
- 缺乏行为：枚举仅用于表示常量，所有的逻辑行为通常在其他地方处理，枚举本身不包含业务逻辑。
- 易于理解和使用：简单、易懂，尤其适合一些比较静态的、需要精确枚举值的场景。

::: code-group

```java [ElementType.java]
/**
 * 无任何属性，只有常量值，相关业务逻辑需要在外部处理
 */
public enum ElementType {
    /** Class, interface (including annotation type), or enum declaration */
    TYPE,

    /** Field declaration (includes enum constants) */
    FIELD,

    /** Method declaration */
    METHOD,

    /** Formal parameter declaration */
    PARAMETER,

    /** Constructor declaration */
    CONSTRUCTOR,

    /** Local variable declaration */
    LOCAL_VARIABLE,

    /** Annotation type declaration */
    ANNOTATION_TYPE,

    /** Package declaration */
    PACKAGE,

    /**
     * Type parameter declaration
     *
     * @since 1.8
     */
    TYPE_PARAMETER,

    /**
     * Use of a type
     *
     * @since 1.8
     */
    TYPE_USE,

    /**
     * Module declaration.
     *
     * @since 9
     */
    MODULE
}
```

```java [RoundingMode.java]
/**
 * 只有一个简单的属性，没有任何行为，相关业务逻辑需要在外部处理
 * 可以看到最开始舍入模式是通过常量定义的，逐步转变为枚举，
 * 直到jdk9，过期了BigDecimal定义的舍入模式常量，
 * 舍入相关的业务基本都是通过外部类实现的。
 */
public enum RoundingMode {

    /**
     * Rounding mode to round away from zero.  Always increments the
     * digit prior to a non-zero discarded fraction.  Note that this
     * rounding mode never decreases the magnitude of the calculated
     * value.
     */
    UP(BigDecimal.ROUND_UP),

    /**
     * Rounding mode to round towards zero.  Never increments the digit
     * prior to a discarded fraction (i.e., truncates).  Note that this
     * rounding mode never increases the magnitude of the calculated value.
     */
    DOWN(BigDecimal.ROUND_DOWN),

    /**
     * Rounding mode to round towards positive infinity.  If the
     * result is positive, behaves as for {@code RoundingMode.UP};
     * if negative, behaves as for {@code RoundingMode.DOWN}.  Note
     * that this rounding mode never decreases the calculated value.
     */
    CEILING(BigDecimal.ROUND_CEILING),

    /**
     * Rounding mode to round towards negative infinity.  If the
     * result is positive, behave as for {@code RoundingMode.DOWN};
     * if negative, behave as for {@code RoundingMode.UP}.  Note that
     * this rounding mode never increases the calculated value.
     */
    FLOOR(BigDecimal.ROUND_FLOOR),

    /**
     * Rounding mode to round towards {@literal "nearest neighbor"}
     * unless both neighbors are equidistant, in which case round up.
     * Behaves as for {@code RoundingMode.UP} if the discarded
     * fraction is &ge; 0.5; otherwise, behaves as for
     * {@code RoundingMode.DOWN}.  Note that this is the rounding
     * mode commonly taught at school.
     */
    HALF_UP(BigDecimal.ROUND_HALF_UP),

    /**
     * Rounding mode to round towards {@literal "nearest neighbor"}
     * unless both neighbors are equidistant, in which case round
     * down.  Behaves as for {@code RoundingMode.UP} if the discarded
     * fraction is &gt; 0.5; otherwise, behaves as for
     * {@code RoundingMode.DOWN}.
     */
    HALF_DOWN(BigDecimal.ROUND_HALF_DOWN),

    /**
     * Rounding mode to round towards the {@literal "nearest neighbor"}
     * unless both neighbors are equidistant, in which case, round
     * towards the even neighbor.  Behaves as for
     * {@code RoundingMode.HALF_UP} if the digit to the left of the
     * discarded fraction is odd; behaves as for
     * {@code RoundingMode.HALF_DOWN} if it's even.  Note that this
     * is the rounding mode that statistically minimizes cumulative
     * error when applied repeatedly over a sequence of calculations.
     * It is sometimes known as {@literal "Banker's rounding,"} and is
     * chiefly used in the USA.  This rounding mode is analogous to
     * the rounding policy used for {@code float} and {@code double}
     * arithmetic in Java.
     */
    HALF_EVEN(BigDecimal.ROUND_HALF_EVEN),

    /**
     * Rounding mode to assert that the requested operation has an exact
     * result, hence no rounding is necessary.  If this rounding mode is
     * specified on an operation that yields an inexact result, an
     * {@code ArithmeticException} is thrown.
     */
    UNNECESSARY(BigDecimal.ROUND_UNNECESSARY);

    // Corresponding BigDecimal rounding constant
    final int oldMode;

    /**
     * Constructor
     *
     * @param oldMode The {@code BigDecimal} constant corresponding to
     *        this mode
     */
    private RoundingMode(int oldMode) {
        this.oldMode = oldMode;
    }

    /**
     * Returns the {@code RoundingMode} object corresponding to a
     * legacy integer rounding mode constant in {@link BigDecimal}.
     *
     * @param  rm legacy integer rounding mode to convert
     * @return {@code RoundingMode} corresponding to the given integer.
     * @throws IllegalArgumentException integer is out of range
     */
    public static RoundingMode valueOf(int rm) {
        switch (rm) {

            case BigDecimal.ROUND_UP:
                return UP;

            case BigDecimal.ROUND_DOWN:
                return DOWN;

            case BigDecimal.ROUND_CEILING:
                return CEILING;

            case BigDecimal.ROUND_FLOOR:
                return FLOOR;

            case BigDecimal.ROUND_HALF_UP:
                return HALF_UP;

            case BigDecimal.ROUND_HALF_DOWN:
                return HALF_DOWN;

            case BigDecimal.ROUND_HALF_EVEN:
                return HALF_EVEN;

            case BigDecimal.ROUND_UNNECESSARY:
                return UNNECESSARY;

            default:
                throw new IllegalArgumentException("argument out of range");
        }
    }
}
```

通过[ElementType](https://github.com/openjdk/jdk/blob/jdk8-b120/jdk/src/share/classes/java/lang/annotation/ElementType.java)
和[RoundingMode](https://github.com/openjdk/jdk/blob/jdk8-b120/jdk/src/share/classes/java/math/RoundingMode.java)
的源码我们可以看到，ElementType的处理都在注解处理器种，
RoundingMode的舍入模式计算也基本都在BigDecimal内部。

贫血枚举适用场景：

- 简单的状态码管理，表示某个对象的状态。
- 需要表示固定的一组常量，且没有过多的行为逻辑。

大多数贫血枚举都可以被替换为普通常量，通常是在`switch-case`或`if-elseif-else`中使用。

:::

### 充血枚举

充血枚举则包含了更丰富的行为和业务逻辑，不仅仅是值的容器。充血枚举不仅有常量值，还可以有方法、属性、实现多个接口行为、甚至是复杂的业务逻辑。
这种设计方式更符合面向对象编程的理念，使得枚举本身更具表现力和扩展性。充血枚举通常有以下特点：

- **包含行为**：枚举不仅包含常量值，还可以实现方法，这些方法可以处理与枚举值相关的逻辑。
- **自包含的业务逻辑**：每个枚举常量都可能有与之相关的业务逻辑，避免了将业务逻辑分散到其他地方的情况。
- **易于扩展**：充血枚举更容易适应未来的需求，增加新方法或扩展逻辑不会影响到现有的代码结构。
- **减少了switch-case的使用**： 如果枚举值需要执行不同的操作，可以直接在枚举常量中定义方法/行为，避免了使用switch-case语句。

::: code-group

```java [Month.java]
public enum Month implements TemporalAccessor, TemporalAdjuster {
    /**
     * The singleton instance for the month of January with 31 days.
     * This has the numeric value of {@code 1}.
     */
    JANUARY,
    /**
     * The singleton instance for the month of February with 28 days, or 29 in a leap year.
     * This has the numeric value of {@code 2}.
     */
    FEBRUARY,
    /**
     * The singleton instance for the month of March with 31 days.
     * This has the numeric value of {@code 3}.
     */
    MARCH,
    /**
     * The singleton instance for the month of April with 30 days.
     * This has the numeric value of {@code 4}.
     */
    APRIL,
    /**
     * The singleton instance for the month of May with 31 days.
     * This has the numeric value of {@code 5}.
     */
    MAY,
    /**
     * The singleton instance for the month of June with 30 days.
     * This has the numeric value of {@code 6}.
     */
    JUNE,
    /**
     * The singleton instance for the month of July with 31 days.
     * This has the numeric value of {@code 7}.
     */
    JULY,
    /**
     * The singleton instance for the month of August with 31 days.
     * This has the numeric value of {@code 8}.
     */
    AUGUST,
    /**
     * The singleton instance for the month of September with 30 days.
     * This has the numeric value of {@code 9}.
     */
    SEPTEMBER,
    /**
     * The singleton instance for the month of October with 31 days.
     * This has the numeric value of {@code 10}.
     */
    OCTOBER,
    /**
     * The singleton instance for the month of November with 30 days.
     * This has the numeric value of {@code 11}.
     */
    NOVEMBER,
    /**
     * The singleton instance for the month of December with 31 days.
     * This has the numeric value of {@code 12}.
     */
    DECEMBER;
    /**
     * Private cache of all the constants.
     */
    private static final Month[] ENUMS = Month.values();

    /**
     * Obtains an instance of {@code Month} from an {@code int} value.
     * <p>
     * {@code Month} is an enum representing the 12 months of the year.
     * This factory allows the enum to be obtained from the {@code int} value.
     * The {@code int} value follows the ISO-8601 standard, from 1 (January) to 12 (December).
     *
     * @param month  the month-of-year to represent, from 1 (January) to 12 (December)
     * @return the month-of-year, not null
     * @throws DateTimeException if the month-of-year is invalid
     */
    public static Month of(int month) {
        if (month < 1 || month > 12) {
            throw new DateTimeException("Invalid value for MonthOfYear: " + month);
        }
        return ENUMS[month - 1];
    }

    /**
     * Obtains an instance of {@code Month} from a temporal object.
     * <p>
     * This obtains a month based on the specified temporal.
     * A {@code TemporalAccessor} represents an arbitrary set of date and time information,
     * which this factory converts to an instance of {@code Month}.
     * <p>
     * The conversion extracts the {@link ChronoField#MONTH_OF_YEAR MONTH_OF_YEAR} field.
     * The extraction is only permitted if the temporal object has an ISO
     * chronology, or can be converted to a {@code LocalDate}.
     * <p>
     * This method matches the signature of the functional interface {@link TemporalQuery}
     * allowing it to be used as a query via method reference, {@code Month::from}.
     *
     * @param temporal  the temporal object to convert, not null
     * @return the month-of-year, not null
     * @throws DateTimeException if unable to convert to a {@code Month}
     */
    public static Month from(TemporalAccessor temporal) {
        if (temporal instanceof Month) {
            return (Month) temporal;
        }
        try {
            if (IsoChronology.INSTANCE.equals(Chronology.from(temporal)) == false) {
                temporal = LocalDate.from(temporal);
            }
            return of(temporal.get(MONTH_OF_YEAR));
        } catch (DateTimeException ex) {
            throw new DateTimeException("Unable to obtain Month from TemporalAccessor: " +
                temporal + " of type " + temporal.getClass().getName(), ex
            );
        }
    }

    /**
     * Gets the month-of-year {@code int} value.
     * <p>
     * The values are numbered following the ISO-8601 standard,
     * from 1 (January) to 12 (December).
     *
     * @return the month-of-year, from 1 (January) to 12 (December)
     */
    public int getValue() {
        return ordinal() + 1;
    }

    /**
     * Gets the textual representation, such as 'Jan' or 'December'.
     * <p>
     * This returns the textual name used to identify the month-of-year,
     * suitable for presentation to the user.
     * The parameters control the style of the returned text and the locale.
     * <p>
     * If no textual mapping is found then the {@link #getValue() numeric value} is returned.
     *
     * @param style  the length of the text required, not null
     * @param locale  the locale to use, not null
     * @return the text value of the month-of-year, not null
     */
    public String getDisplayName(TextStyle style, Locale locale) {
        return new DateTimeFormatterBuilder().appendText(MONTH_OF_YEAR, style).toFormatter(locale).format(this);
    }

    @Override
    public boolean isSupported(TemporalField field) {
        if (field instanceof ChronoField) {
            return field == MONTH_OF_YEAR;
        }
        return field != null && field.isSupportedBy(this);
    }

    @Override
    public ValueRange range(TemporalField field) {
        if (field == MONTH_OF_YEAR) {
            return field.range();
        }
        return TemporalAccessor.super.range(field);
    }

    @Override
    public int get(TemporalField field) {
        if (field == MONTH_OF_YEAR) {
            return getValue();
        }
        return TemporalAccessor.super.get(field);
    }

    @Override
    public long getLong(TemporalField field) {
        if (field == MONTH_OF_YEAR) {
            return getValue();
        } else if (field instanceof ChronoField) {
            throw new UnsupportedTemporalTypeException("Unsupported field: " + field);
        }
        return field.getFrom(this);
    }

    //-----------------------------------------------------------------------

    /**
     * Returns the month-of-year that is the specified number of months after this one.
     * <p>
     * The calculation rolls around the end of the year from December to January.
     * The specified period may be negative.
     * <p>
     * This instance is immutable and unaffected by this method call.
     *
     * @param months  the months to add, positive or negative
     * @return the resulting month, not null
     */
    public Month plus(long months) {
        int amount = (int) (months % 12);
        return ENUMS[(ordinal() + (amount + 12)) % 12];
    }

    /**
     * Returns the month-of-year that is the specified number of months before this one.
     * <p>
     * The calculation rolls around the start of the year from January to December.
     * The specified period may be negative.
     * <p>
     * This instance is immutable and unaffected by this method call.
     *
     * @param months  the months to subtract, positive or negative
     * @return the resulting month, not null
     */
    public Month minus(long months) {
        return plus(-(months % 12));
    }

    /**
     * Gets the length of this month in days.
     * <p>
     * This takes a flag to determine whether to return the length for a leap year or not.
     * <p>
     * February has 28 days in a standard year and 29 days in a leap year.
     * April, June, September and November have 30 days.
     * All other months have 31 days.
     *
     * @param leapYear  true if the length is required for a leap year
     * @return the length of this month in days, from 28 to 31
     */
    public int length(boolean leapYear) {
        switch (this) {
            case FEBRUARY:
                return (leapYear ? 29 : 28);
            case APRIL:
            case JUNE:
            case SEPTEMBER:
            case NOVEMBER:
                return 30;
            default:
                return 31;
        }
    }

    /**
     * Gets the minimum length of this month in days.
     * <p>
     * February has a minimum length of 28 days.
     * April, June, September and November have 30 days.
     * All other months have 31 days.
     *
     * @return the minimum length of this month in days, from 28 to 31
     */
    public int minLength() {
        switch (this) {
            case FEBRUARY:
                return 28;
            case APRIL:
            case JUNE:
            case SEPTEMBER:
            case NOVEMBER:
                return 30;
            default:
                return 31;
        }
    }

    /**
     * Gets the maximum length of this month in days.
     * <p>
     * February has a maximum length of 29 days.
     * April, June, September and November have 30 days.
     * All other months have 31 days.
     *
     * @return the maximum length of this month in days, from 29 to 31
     */
    public int maxLength() {
        switch (this) {
            case FEBRUARY:
                return 29;
            case APRIL:
            case JUNE:
            case SEPTEMBER:
            case NOVEMBER:
                return 30;
            default:
                return 31;
        }
    }

    /**
     * Gets the day-of-year corresponding to the first day of this month.
     * <p>
     * This returns the day-of-year that this month begins on, using the leap
     * year flag to determine the length of February.
     *
     * @param leapYear  true if the length is required for a leap year
     * @return the day of year corresponding to the first day of this month, from 1 to 336
     */
    public int firstDayOfYear(boolean leapYear) {
        int leap = leapYear ? 1 : 0;
        switch (this) {
            case JANUARY:
                return 1;
            case FEBRUARY:
                return 32;
            case MARCH:
                return 60 + leap;
            case APRIL:
                return 91 + leap;
            case MAY:
                return 121 + leap;
            case JUNE:
                return 152 + leap;
            case JULY:
                return 182 + leap;
            case AUGUST:
                return 213 + leap;
            case SEPTEMBER:
                return 244 + leap;
            case OCTOBER:
                return 274 + leap;
            case NOVEMBER:
                return 305 + leap;
            case DECEMBER:
            default:
                return 335 + leap;
        }
    }

    /**
     * Gets the month corresponding to the first month of this quarter.
     * <p>
     * The year can be divided into four quarters.
     * This method returns the first month of the quarter for the base month.
     * January, February and March return January.
     * April, May and June return April.
     * July, August and September return July.
     * October, November and December return October.
     *
     * @return the first month of the quarter corresponding to this month, not null
     */
    public Month firstMonthOfQuarter() {
        return ENUMS[(ordinal() / 3) * 3];
    }

    @SuppressWarnings("unchecked")
    @Override
    public <R> R query(TemporalQuery<R> query) {
        if (query == TemporalQueries.chronology()) {
            return (R) IsoChronology.INSTANCE;
        } else if (query == TemporalQueries.precision()) {
            return (R) MONTHS;
        }
        return TemporalAccessor.super.query(query);
    }

    @Override
    public Temporal adjustInto(Temporal temporal) {
        if (Chronology.from(temporal).equals(IsoChronology.INSTANCE) == false) {
            throw new DateTimeException("Adjustment only supported on ISO date-time");
        }
        return temporal.with(MONTH_OF_YEAR, getValue());
    }

}
```

```java [TimeUnit.java]
public enum TimeUnit {
    /**
     * Time unit representing one thousandth of a microsecond.
     */
    NANOSECONDS(TimeUnit.NANO_SCALE),
    /**
     * Time unit representing one thousandth of a millisecond.
     */
    MICROSECONDS(TimeUnit.MICRO_SCALE),
    /**
     * Time unit representing one thousandth of a second.
     */
    MILLISECONDS(TimeUnit.MILLI_SCALE),
    /**
     * Time unit representing one second.
     */
    SECONDS(TimeUnit.SECOND_SCALE),
    /**
     * Time unit representing sixty seconds.
     * @since 1.6
     */
    MINUTES(TimeUnit.MINUTE_SCALE),
    /**
     * Time unit representing sixty minutes.
     * @since 1.6
     */
    HOURS(TimeUnit.HOUR_SCALE),
    /**
     * Time unit representing twenty four hours.
     * @since 1.6
     */
    DAYS(TimeUnit.DAY_SCALE);

    // Scales as constants
    private static final long NANO_SCALE = 1L;
    private static final long MICRO_SCALE = 1000L * NANO_SCALE;
    private static final long MILLI_SCALE = 1000L * MICRO_SCALE;
    private static final long SECOND_SCALE = 1000L * MILLI_SCALE;
    private static final long MINUTE_SCALE = 60L * SECOND_SCALE;
    private static final long HOUR_SCALE = 60L * MINUTE_SCALE;
    private static final long DAY_SCALE = 24L * HOUR_SCALE;

    /*
     * Instances cache conversion ratios and saturation cutoffs for
     * the units up through SECONDS. Other cases compute them, in
     * method cvt.
     */

    private final long scale;
    private final long maxNanos;
    private final long maxMicros;
    private final long maxMillis;
    private final long maxSecs;
    private final long microRatio;
    private final int milliRatio;   // fits in 32 bits
    private final int secRatio;     // fits in 32 bits

    private TimeUnit(long s) {
        this.scale = s;
        this.maxNanos = Long.MAX_VALUE / s;
        long ur = (s >= MICRO_SCALE) ? (s / MICRO_SCALE) : (MICRO_SCALE / s);
        this.microRatio = ur;
        this.maxMicros = Long.MAX_VALUE / ur;
        long mr = (s >= MILLI_SCALE) ? (s / MILLI_SCALE) : (MILLI_SCALE / s);
        this.milliRatio = (int) mr;
        this.maxMillis = Long.MAX_VALUE / mr;
        long sr = (s >= SECOND_SCALE) ? (s / SECOND_SCALE) : (SECOND_SCALE / s);
        this.secRatio = (int) sr;
        this.maxSecs = Long.MAX_VALUE / sr;
    }

    /**
     * General conversion utility.
     *
     * @param d duration
     * @param dst result unit scale
     * @param src source unit scale
     */
    private static long cvt(long d, long dst, long src) {
        long r, m;
        if (src == dst)
            return d;
        else if (src < dst)
            return d / (dst / src);
        else if (d > (m = Long.MAX_VALUE / (r = src / dst)))
            return Long.MAX_VALUE;
        else if (d < -m)
            return Long.MIN_VALUE;
        else
            return d * r;
    }

    /**
     * Converts the given time duration in the given unit to this unit.
     * Conversions from finer to coarser granularities truncate, so
     * lose precision. For example, converting {@code 999} milliseconds
     * to seconds results in {@code 0}. Conversions from coarser to
     * finer granularities with arguments that would numerically
     * overflow saturate to {@code Long.MIN_VALUE} if negative or
     * {@code Long.MAX_VALUE} if positive.
     *
     * <p>For example, to convert 10 minutes to milliseconds, use:
     * {@code TimeUnit.MILLISECONDS.convert(10L, TimeUnit.MINUTES)}
     *
     * @param sourceDuration the time duration in the given {@code sourceUnit}
     * @param sourceUnit the unit of the {@code sourceDuration} argument
     * @return the converted duration in this unit,
     * or {@code Long.MIN_VALUE} if conversion would negatively overflow,
     * or {@code Long.MAX_VALUE} if it would positively overflow.
     */
    public long convert(long sourceDuration, TimeUnit sourceUnit) {
        switch (this) {
            case NANOSECONDS:
                return sourceUnit.toNanos(sourceDuration);
            case MICROSECONDS:
                return sourceUnit.toMicros(sourceDuration);
            case MILLISECONDS:
                return sourceUnit.toMillis(sourceDuration);
            case SECONDS:
                return sourceUnit.toSeconds(sourceDuration);
            default:
                return cvt(sourceDuration, scale, sourceUnit.scale);
        }
    }

    /**
     * Equivalent to
     * {@link #convert(long, TimeUnit) NANOSECONDS.convert(duration, this)}.
     * @param duration the duration
     * @return the converted duration,
     * or {@code Long.MIN_VALUE} if conversion would negatively overflow,
     * or {@code Long.MAX_VALUE} if it would positively overflow.
     */
    public long toNanos(long duration) {
        long s, m;
        if ((s = scale) == NANO_SCALE)
            return duration;
        else if (duration > (m = maxNanos))
            return Long.MAX_VALUE;
        else if (duration < -m)
            return Long.MIN_VALUE;
        else
            return duration * s;
    }

    /**
     * Equivalent to
     * {@link #convert(long, TimeUnit) MICROSECONDS.convert(duration, this)}.
     * @param duration the duration
     * @return the converted duration,
     * or {@code Long.MIN_VALUE} if conversion would negatively overflow,
     * or {@code Long.MAX_VALUE} if it would positively overflow.
     */
    public long toMicros(long duration) {
        long s, m;
        if ((s = scale) == MICRO_SCALE)
            return duration;
        else if (s < MICRO_SCALE)
            return duration / microRatio;
        else if (duration > (m = maxMicros))
            return Long.MAX_VALUE;
        else if (duration < -m)
            return Long.MIN_VALUE;
        else
            return duration * microRatio;
    }

    /**
     * Equivalent to
     * {@link #convert(long, TimeUnit) MILLISECONDS.convert(duration, this)}.
     * @param duration the duration
     * @return the converted duration,
     * or {@code Long.MIN_VALUE} if conversion would negatively overflow,
     * or {@code Long.MAX_VALUE} if it would positively overflow.
     */
    public long toMillis(long duration) {
        long s, m;
        if ((s = scale) == MILLI_SCALE)
            return duration;
        else if (s < MILLI_SCALE)
            return duration / milliRatio;
        else if (duration > (m = maxMillis))
            return Long.MAX_VALUE;
        else if (duration < -m)
            return Long.MIN_VALUE;
        else
            return duration * milliRatio;
    }

    /**
     * Equivalent to
     * {@link #convert(long, TimeUnit) SECONDS.convert(duration, this)}.
     * @param duration the duration
     * @return the converted duration,
     * or {@code Long.MIN_VALUE} if conversion would negatively overflow,
     * or {@code Long.MAX_VALUE} if it would positively overflow.
     */
    public long toSeconds(long duration) {
        long s, m;
        if ((s = scale) == SECOND_SCALE)
            return duration;
        else if (s < SECOND_SCALE)
            return duration / secRatio;
        else if (duration > (m = maxSecs))
            return Long.MAX_VALUE;
        else if (duration < -m)
            return Long.MIN_VALUE;
        else
            return duration * secRatio;
    }

    /**
     * Equivalent to
     * {@link #convert(long, TimeUnit) MINUTES.convert(duration, this)}.
     * @param duration the duration
     * @return the converted duration,
     * or {@code Long.MIN_VALUE} if conversion would negatively overflow,
     * or {@code Long.MAX_VALUE} if it would positively overflow.
     * @since 1.6
     */
    public long toMinutes(long duration) {
        return cvt(duration, MINUTE_SCALE, scale);
    }

    /**
     * Equivalent to
     * {@link #convert(long, TimeUnit) HOURS.convert(duration, this)}.
     * @param duration the duration
     * @return the converted duration,
     * or {@code Long.MIN_VALUE} if conversion would negatively overflow,
     * or {@code Long.MAX_VALUE} if it would positively overflow.
     * @since 1.6
     */
    public long toHours(long duration) {
        return cvt(duration, HOUR_SCALE, scale);
    }

    /**
     * Equivalent to
     * {@link #convert(long, TimeUnit) DAYS.convert(duration, this)}.
     * @param duration the duration
     * @return the converted duration
     * @since 1.6
     */
    public long toDays(long duration) {
        return cvt(duration, DAY_SCALE, scale);
    }

    /**
     * Utility to compute the excess-nanosecond argument to wait,
     * sleep, join.
     * @param d the duration
     * @param m the number of milliseconds
     * @return the number of nanoseconds
     */
    private int excessNanos(long d, long m) {
        long s;
        if ((s = scale) == NANO_SCALE)
            return (int) (d - (m * MILLI_SCALE));
        else if (s == MICRO_SCALE)
            return (int) ((d * 1000L) - (m * MILLI_SCALE));
        else
            return 0;
    }

    /**
     * Performs a timed {@link Object#wait(long, int) Object.wait}
     * using this time unit.
     * This is a convenience method that converts timeout arguments
     * into the form required by the {@code Object.wait} method.
     *
     * <p>For example, you could implement a blocking {@code poll}
     * method (see {@link BlockingQueue#poll BlockingQueue.poll})
     * using:
     *
     * <pre> {@code
     * public synchronized Object poll(long timeout, TimeUnit unit)
     *     throws InterruptedException {
     *   while (empty) {
     *     unit.timedWait(this, timeout);
     *     ...
     *   }
     * }}</pre>
     *
     * @param obj the object to wait on
     * @param timeout the maximum time to wait. If less than
     * or equal to zero, do not wait at all.
     * @throws InterruptedException if interrupted while waiting
     */
    public void timedWait(Object obj, long timeout)
        throws InterruptedException {
        if (timeout > 0) {
            long ms = toMillis(timeout);
            int ns = excessNanos(timeout, ms);
            obj.wait(ms, ns);
        }
    }

    /**
     * Performs a timed {@link Thread#join(long, int) Thread.join}
     * using this time unit.
     * This is a convenience method that converts time arguments into the
     * form required by the {@code Thread.join} method.
     *
     * @param thread the thread to wait for
     * @param timeout the maximum time to wait. If less than
     * or equal to zero, do not wait at all.
     * @throws InterruptedException if interrupted while waiting
     */
    public void timedJoin(Thread thread, long timeout)
        throws InterruptedException {
        if (timeout > 0) {
            long ms = toMillis(timeout);
            int ns = excessNanos(timeout, ms);
            thread.join(ms, ns);
        }
    }

    /**
     * Performs a {@link Thread#sleep(long, int) Thread.sleep} using
     * this time unit.
     * This is a convenience method that converts time arguments into the
     * form required by the {@code Thread.sleep} method.
     *
     * @param timeout the minimum time to sleep. If less than
     * or equal to zero, do not sleep at all.
     * @throws InterruptedException if interrupted while sleeping
     */
    public void sleep(long timeout) throws InterruptedException {
        if (timeout > 0) {
            long ms = toMillis(timeout);
            int ns = excessNanos(timeout, ms);
            Thread.sleep(ms, ns);
        }
    }

    /**
     * Converts this {@code TimeUnit} to the equivalent {@code ChronoUnit}.
     *
     * @return the converted equivalent ChronoUnit
     * @since 9
     */
    public ChronoUnit toChronoUnit() {
        switch (this) {
            case NANOSECONDS:
                return ChronoUnit.NANOS;
            case MICROSECONDS:
                return ChronoUnit.MICROS;
            case MILLISECONDS:
                return ChronoUnit.MILLIS;
            case SECONDS:
                return ChronoUnit.SECONDS;
            case MINUTES:
                return ChronoUnit.MINUTES;
            case HOURS:
                return ChronoUnit.HOURS;
            case DAYS:
                return ChronoUnit.DAYS;
            default:
                throw new AssertionError();
        }
    }

    /**
     * Converts a {@code ChronoUnit} to the equivalent {@code TimeUnit}.
     *
     * @param chronoUnit the ChronoUnit to convert
     * @return the converted equivalent TimeUnit
     * @throws IllegalArgumentException if {@code chronoUnit} has no
     *         equivalent TimeUnit
     * @throws NullPointerException if {@code chronoUnit} is null
     * @since 9
     */
    public static TimeUnit of(ChronoUnit chronoUnit) {
        switch (Objects.requireNonNull(chronoUnit, "chronoUnit")) {
            case NANOS:
                return TimeUnit.NANOSECONDS;
            case MICROS:
                return TimeUnit.MICROSECONDS;
            case MILLIS:
                return TimeUnit.MILLISECONDS;
            case SECONDS:
                return TimeUnit.SECONDS;
            case MINUTES:
                return TimeUnit.MINUTES;
            case HOURS:
                return TimeUnit.HOURS;
            case DAYS:
                return TimeUnit.DAYS;
            default:
                throw new IllegalArgumentException(
                    "No TimeUnit equivalent for " + chronoUnit);
        }
    }

}
```

:::

从[Month](https://github.com/openjdk/jdk/blob/jdk8-b120/jdk/src/share/classes/java/time/Month.java)可以看到，
除了基础的常量1-12月外，还定义了一些方法，比如获取月份的名称、获取月份的最大/最小天数、获取月份的第一天等，还实现了TemporalAccessor、TemporalAdjuster接口的公共行为。

[TimeUnit](https://github.com/openjdk/jdk/blob/jdk8-b120/jdk/src/share/classes/java/util/concurrent/TimeUnit.java)
定义了常用的时间单位，
比如纳秒、微秒、毫秒、秒、分钟、小时、天等，还定义了一些方法，比如任意单位之间的转换、结合Thread实现更为直观的sleep等。

充血枚举适用场景：

- 需要在枚举中封装与枚举值相关的逻辑。

- 增加扩展性时，不想将逻辑分散到外部类中。

- 适用于表示复杂的对象或状态，且需要在其中包含业务逻辑。

充血枚举体现了“将变化封装在内部”的设计原则，是领域驱动设计(DDD)中值对象的良好实现方式之一。

### 对比总结

| 特性      | 贫血枚举               | 充血枚举                        |
|---------|--------------------|-----------------------------|
| 枚举值     | 简单的常量              | 包含常量、复杂属性                   |
| 行为与业务逻辑 | 分散在枚举使用的地方         | 集中在枚举内部                     |
| 易用性     | 清晰明了，易于理解          | 较复杂，封装了复杂的业务逻辑，提供了更多的功能和灵活性 |
| 扩展性     | 扩展困难，添加新功能需要修改多处代码 | 容易扩展，可以在枚举内部添加新方法           |
| 可维护性    | 较低，修改时需要查找所有使用点    | 较高，修改只需在枚举内部进行              |

::: tip 实践建议

- 优先使用充血枚举：当枚举需要关联行为时，充血枚举是更好的选择

- 保持简单：如果枚举只是简单标识，贫血枚举可能更合适

- 避免switch-case/if else：使用充血枚举可以减少switch/if语句，提高代码可维护性

- 考虑不可变性：枚举值通常应该是不可变的

:::
