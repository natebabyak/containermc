package fake_test

import (
	"containermc/internal/runtime/contracttest"
	"containermc/internal/runtime/fake"
	"go.uber.org/goleak"
	"testing"
)

func TestContract(t *testing.T) { defer goleak.VerifyNone(t); contracttest.Run(t, fake.New(), "fake") }
