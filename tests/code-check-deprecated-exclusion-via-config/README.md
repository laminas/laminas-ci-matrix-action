# Reason for this test

Until the matrix action v1.12.0, we returned `locked` within the generated JOB even tho, no `composer.lock` file existed.
This has been changed with the conversion to typescript to make it more clear on what is being executed in the container.

Projects were able to exclude checks by using something like even tho, no `composer.lock` file was present.

```json
{
    "exclude": [
        {
            "name": "PHPUnit on PHP 8.0 with locked dependencies"
        }
    ]
}
```

This would not work with the refactoring anymore and thus, we have to verify that it will work again.
