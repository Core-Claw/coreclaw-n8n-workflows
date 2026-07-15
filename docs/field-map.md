# Google Maps Scraper → Google Sheets field map

Map from the `coreclaw/google-maps-scraper` worker result fields (verified against a real run, 2026-07-15) to the Google Sheets columns the workflows write. Every Code node in `../workflows/` uses this exact mapping.

> The worker's README example differs from the real result in several places (see "Gotchas" at the bottom). This table reflects **real output**, not the README sample.

## Lead sheet columns (what the workflow writes)

| Sheet column | Worker result key | Type | Example | Notes |
| --- | --- | --- | --- | --- |
| search_rank | `search_rank` | number | `1` | Rank within the search |
| title | `title` | string | `American HVAC Corp – Top HVAC Contractor NYC` | Business name |
| phone | `phone` | string | `(347) 382-9030` | |
| website | `website` | string | `https://americanhvac.nyc/...` | |
| emails | `all_emails` | string | `info@a.com, rebate@b.com` | Comma-separated, **not an array** |
| primary_category | `primary_category` | string | `HVAC contractor` | |
| categories | `all_categories` | string | `HVAC contractor, Air conditioning contractor, …` | Comma-separated |
| review_rating | `review_rating` | number | `4.9` | Star rating |
| review_count | `review_count` | number | `147` | Total reviews |
| status | `status` | string | `Open 24 hours` | Operating hours, not open/closed |
| city | `city` | string | `New York` | |
| state | `state` | string | `New York` | |
| address | `address` | string | `368 9th Ave 6th floor, New York, NY 10001` | |
| latitude | `latitude` | number | `40.7512627` | |
| longitude | `longitude` | number | `-73.9976446` | |
| place_url | `url` | string | `https://www.google.com/maps/place/...` | Place URL |
| lead_score | *(computed)* | number | `87` | `round(min(100, rating·log10(reviews+1)·12 + hasEmail·15 + hasWebsite·5))` |
| source_keyword | `source_keyword` | string | `HVAC Contractors` | |
| source_location | `source_location` | string | `New York, USA` | |
| scraped_at | `scraped_at` | string | `2026-07-15 07:57:23` | |

## Other available result keys (not written to the sheet by default)

`data_id`, `cid`, `street`, `postal_code`, `country`, `category_2..4`, `plus_code`, `email_1..4` + `email_N_status` + `email_N_is_business_email`, `facebook_url_1..2`, `instagram_url_1..2`, `twitter_url`, `youtube_url_1..2`, `tiktok_url_1..2`, `linkedin_url_1..2`, `rating_1_count..rating_5_count`, `description`, `thumbnail`, `timezone`, `images_count`, `images/N/title`, `images/N/image`, `owner_id`, `owner_name`, `owner_link`.

To add any of these to the sheet, extend the `Normalize & Score` Code node's return object and the Google Sheets header row.

## Gotchas (real output vs README sample)

| README sample says | Real output is |
| --- | --- |
| `rating` / `reviews_total` | `review_rating` / `review_count` |
| `all_emails` is an array | `all_emails` is a comma-separated **string** |
| `all_categories` is an array | `all_categories` is a comma-separated **string** |
| `email_status` is a nested object | flat `email_N_status` / `email_N_is_business_email` columns |
| `business_status` | `status` — and its value is hours like `Open 24 hours`, not `open`/`closed` |

If you adapt a Code node from the old v1 workflows, fix these four or the columns come back empty.
