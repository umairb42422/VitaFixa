#!/bin/sh
# Verifies the backend folder structure defined in docs/architecture/LLD.md section 4.
cd "$(dirname "$0")/.." || exit 1
fail=0
need() { [ -d "$1" ] || { echo "MISSING: $1"; fail=1; }; }
for d in common/filters common/guards common/interceptors common/decorators common/exceptions common/logging \
         infrastructure/database infrastructure/authentication infrastructure/storage infrastructure/notifications infrastructure/external-services; do
  need "src/$d"
done
for m in identity user-profile nutrition food-database workout notifications progress ai-assistant research-centre; do
  for l in domain/entities domain/value-objects domain/interfaces domain/services \
           application/use-cases application/dto application/interfaces application/services \
           infrastructure/repositories infrastructure/adapters presentation/controllers presentation/dto; do
    need "src/modules/$m/$l"
  done
  [ -f "src/modules/$m/README.md" ] || { echo "MISSING: src/modules/$m/README.md"; fail=1; }
done
need test; need prisma
[ -f prisma/schema.prisma ] || { echo "MISSING: prisma/schema.prisma"; fail=1; }
grep -q 'env("DATABASE_URL")' prisma/schema.prisma || { echo "schema must read DATABASE_URL from env"; fail=1; }
grep -Eq 'postgres(ql)?://[^"]*:[^"@]+@' prisma/schema.prisma && { echo "credentials found in schema"; fail=1; }
[ "$fail" -eq 0 ] && echo "Structure OK"
exit $fail
